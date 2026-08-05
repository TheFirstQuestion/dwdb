# Fix lettered story-part merging in `episode-parser.ts`

## Goal

Fix a bug in how the episode parser groups wiki rows whose `wikiNumber` shares
a numeric base with a letter suffix (`166a`/`166b`, `297a`–`297f`,
`311a`/`311b`, `143a`–`143d`, ...). Today `mergeLetteredParts` merges every
such group into one story with one episode per lettered part. That's correct
for two/six-parters like "Bad Wolf"/"The Parting of the Ways" or Flux, but
wrong for "The Trial of a Time Lord" (`143a`–`143d`): each of its four parts
is itself a classic-style multi-episode serial (4, 4, 4, 2 episodes), so
merging collapses 14 real episodes down to 4.

## Domain background

Three distinct concepts were being conflated:

- **Story** — one narrative unit. Can have multiple parts with distinct
  titles (Bad Wolf/Parting of the Ways, Flux) or multiple parts sharing one
  title (classic serials like "The Daleks").
- **Story arc** — an editorial/thematic link across *separate* stories (e.g.
  "The Trial of a Time Lord" links four separate stories; the "Bad Wolf" arc
  links "The Long Game," "Bad Wolf," and "The Parting of the Ways," which are
  themselves separate stories too — arc membership and story-part membership
  are independent).
- The wiki's letter-suffix convention (`NNNa`, `NNNb`, ...) is used for
  **both** "these rows are one story's parts" and "these rows are separate
  stories in an arc," and does not distinguish between them on its own.

Populating actual arc data (the `arcs`/`story_arcs` tables) is a separate,
already-tracked roadmap item (`docs/GOALS.md` roadmap: "story arcs (not
started)") and is **out of scope** here. This change only fixes story
boundaries — which rows merge into one story.

## Decision: denylist, not allowlist

Default behavior (auto-merge lettered groups by base number) stays as the
default going forward — newer stories follow the merge convention. A small
denylist names the groups that must *not* merge:

```ts
// Story parts vs. story arc segments look identical in the wiki's lettering
// convention (NNNa, NNNb, ...) — nothing in the letter suffix itself
// distinguishes "one story, several parts" from "several stories in an
// arc." Every group merges by default *except* the ones listed here, which
// are known, by domain knowledge (not derivable from wiki formatting), to be
// separate stories rather than parts of one story.
//
// "143" = The Trial of a Time Lord: four separate stories (The Mysterious
// Planet, Mindwarp, Terror of the Vervoids, The Ultimate Foe), linked by the
// "Trial of a Time Lord" story arc — not one four-part story.
//
// Add a new base number here (with a comment explaining why, same as
// above) whenever a newly-discovered lettered group turns out to be
// separate stories rather than one story's parts.
const NON_MERGING_STORY_GROUPS: ReadonlySet<string> = new Set(["143"]);
```

`mergeLetteredParts` checks this set when flushing a buffered lettered group:
if the group's base number is in `NON_MERGING_STORY_GROUPS`, skip merging —
push each row through as its own independent `ParsedStory`, keeping its full
lettered `wikiNumber` (e.g. `"143a"`).

No change is needed to `ParsedStoryPart`/`buildEpisodeRows`: every group that
*does* merge today is modern-style (one episode per lettered part), so the
existing `parts: { title, airDate }[]` shape already covers it. Once `143a`–
`143d` are excluded from merging, each flows through the pre-existing classic
single-row branch of `buildEpisodeRows`, which already synthesizes 4/4/4/2
episodes correctly per row — that branch doesn't change.

`ParsedStory` gains one new field:

```ts
export interface ParsedStory {
  // ...existing fields...

  // True when this row was parsed via the "classic" branch of parseRow —
  // i.e. its own title cell carried the title (not just a part label) and
  // its own episode-count cell is meaningful on its own. This is the
  // structural signal the drift-guard test (below) uses to flag lettered
  // groups that might be story-arc segments rather than story parts.
  isClassic: boolean;
}
```

`parseRow` already computes `isClassic` locally; this just returns it instead
of discarding it.

`parseStories` currently builds the raw per-row list internally and pipes it
straight into `mergeLetteredParts` before returning — there's no seam to
inspect the pre-merge rows. Split that into an exported `parseRawStories`
(builds the raw `ParsedStory[]`, no merging) and keep `parseStories` as
`mergeLetteredParts(parseRawStories(wikitext))`. `NON_MERGING_STORY_GROUPS`
is also exported. Both are needed by the drift-guard test below.

## Testing plan

All added to `tests/episode-parser.test.ts`, in the existing `describe("parseStories", ...)` block, following the same red → green cycle as prior work in this file (write the assertion, confirm it fails against current behavior, then implement).

### Pinned regression examples

Exact known facts, not derived from the wiki's formatting:

- `166a`/`166b` ("Bad Wolf"/"The Parting of the Ways") merge into one story,
  2 parts, distinct titles.
- `297a`–`297f` (Flux) merge into one story, 6 parts, distinct chapter
  titles.
- `143a`–`143d` (The Trial of a Time Lord) do **not** merge — four separate
  stories, `episodeCount` 4/4/4/2 respectively, each retaining its lettered
  `wikiNumber` (`"143a"`, `"143b"`, `"143c"`, `"143d"`).
- Existing `311a`/`311b` test is unchanged (already covers a merge case).

### Drift guard

```ts
it("flags every classic-style lettered group as a denylist entry (or fails, prompting a human decision)", () => {
  // Re-derive the raw, pre-merge rows for this assertion. parseStories()
  // only returns the post-merge result, so this test needs a way to see
  // the rows before mergeLetteredParts runs — either export an unmerged
  // variant for tests, or export mergeLetteredParts's input shape directly.
  const rawStories = parseRawStories(wikitext); // pre-merge ParsedStory[]

  const classicBaseNumbers = new Set<string>();
  for (const story of rawStories) {
    const m = story.wikiNumber.match(/^(\d+)([a-z])$/);
    if (m && story.isClassic) classicBaseNumbers.add(m[1]);
  }

  // Every base number flagged as classic-style must already be a deliberate
  // denylist entry. A base number showing up here that ISN'T in
  // NON_MERGING_STORY_GROUPS means a new Trial-of-a-Time-Lord-shaped group
  // appeared in the wiki data and nobody has classified it yet.
  for (const base of classicBaseNumbers) {
    expect(NON_MERGING_STORY_GROUPS.has(base)).toBe(true);
  }
});
```

This test reads the real wiki dump (via the existing `loadWikitext()` test
helper) rather than hand-built fixtures, since it's checking a property of
the live data, not a specific parser function's output shape. It needs
`parseRawStories` (or equivalent) and `NON_MERGING_STORY_GROUPS` exported
from `episode-parser.ts` for the test to reach them — today only
`parseStories` (the merged result) is exported.

## Comment requirement

Per working preference: every fact above that came from the user answering a
clarifying question during design (what `isClassic` means, why `143` is
denylisted while other lettered groups merge, what the drift guard does and
doesn't catch) must land as an inline code comment at the relevant line when
implemented — not only in this doc. The snippets above already show the
intended comments; carry them into the actual implementation verbatim or
close to it.

## Out of scope

- Populating `arcs`/`story_arcs` tables (separate roadmap item).
- Detecting future *modern*-style lettered groups that should be arcs rather
  than merges (accepted risk of the denylist-over-allowlist decision).
- Any change to `buildEpisodeRows` or `ParsedStoryPart` (not needed — see
  above).
