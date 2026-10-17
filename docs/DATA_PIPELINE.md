# dwdb — Data Pipeline

How wiki source data becomes seeded database rows. This is offline prep/tooling work — it runs against your local Postgres before the API ever serves a request, separately from the runtime architecture described in [ARCHITECTURE.md](ARCHITECTURE.md).

> This is a living document: it should be updated in the same change that alters migrations, parsers, or seed scripts — not left to drift from the code it describes.

## Overview

The pipeline has four stages, run in order:

```text
wiki-data (JSON) → parsers (api/seeds/*-parser.ts) → seed scripts (api/seeds/seed-NN-*.ts) → Postgres
```

Migrations must be applied before seeding — seed scripts insert into tables the migrations create.

## Source

`api/wiki-data/pages/List_of_Doctor_Who_television_stories.json` is a raw MediaWiki API dump: page revisions with wikitext in `query.pages[...].revisions[0].slots.main["*"]`. Every parser reads this same file and extracts the wikitext before parsing.

Download or refresh it with:

- `pnpm api:wiki:download` — full page fetch
- `pnpm api:wiki:download:test` — capped to 50 pages (`MAX_PAGES=50`), for faster iteration

## Parsers (`api/seeds/*-parser.ts`)

Pure functions that take wikitext and return typed rows — no database access, no side effects. Each is scoped to one concern:

- **`era-parser.ts`** — extracts Doctor eras: actor name, incarnation id, start/end year.
- **`season-parser.ts`** — extracts seasons/series: number, name, year, which era they belong to. Its `SeasonHeading` and `SeasonData` interfaces live in `season-parser.types.ts`.
- **`episode-parser.ts`** — extracts individual episodes/stories: title, air date, part number, story grouping.

Being pure and side-effect-free is what makes these independently testable (see `tests/episode-parser.test.ts`) without a database — a parser bug can be reproduced and fixed with a unit test alone.

### Story grouping in `episode-parser.ts`

A wiki table row is one story, except two cases the parser normalizes before returning:

- **Classic multi-part stories** — one row covers a whole serial (e.g. "An Unearthly Child", 4 episodes). The row's `episodeCount` carries the total; there's no per-part title or air date in the source, so `buildEpisodeRows` (below) synthesizes one row per part, all sharing the story title.
- **Lettered modern two-parters** — the wiki numbers stories like `311a`/`311b` ("The Legend of Ruby Sunday" / "Empire of Death") as separate rows sharing a numeric base with a letter suffix, each with its own title and air date. `mergeLetteredParts` collapses consecutive rows sharing a base number into a single `ParsedStory` (`storyNumber` = the base, e.g. `"311"`) with a `parts: { title, airDate }[]` array holding each part's own data.

Not every lettered group is a story's parts, though — the wiki reuses the same `NNNa`/`NNNb`/... convention for *story arcs* that link several genuinely separate stories (e.g. `143a`–`143d`, "The Trial of a Time Lord," links four independent classic serials rather than being one four-part story). Nothing in the letter suffix distinguishes the two cases, so `mergeLetteredParts` treats every lettered group as mergeable by default except the base numbers listed in the exported `NON_MERGING_STORY_GROUPS` denylist — those are pushed through as independent `ParsedStory` rows, keeping their full lettered `storyNumber`. Add to the denylist (with a comment explaining why) whenever a newly-discovered lettered group turns out to be arc segments rather than story parts; `tests/episode-parser.test.ts` has a drift-guard test that fails when a new classic-style lettered group appears in the wiki data without a denylist entry. Populating the `arcs`/`story_arcs` tables themselves is a separate, not-yet-started roadmap item (see `docs/GOALS.md`).

Some wikitable rows also share one column's value across several consecutive rows via a `rowspan="N"|value` cell on only the first row (e.g. Flux's `297a`–`297f` share a single "1-6" episode-number cell) — the later rows in the span omit that column entirely in the source wikitext, so they parse one cell short. `parseRawStories` carries the declaring row's cell value forward for the rest of the span instead of dropping those rows for being short a column.

The list page's number column is stored as `ParsedStory.storyNumber` (the `stories.story_number` column, renamed from `wiki_number`); it is a string because of lettered numbers like `311a`, and absent for number-less stories.

**Number-less stories.** Rows whose number cell is `-` (minisodes, animated serials, Comic Relief and Children in Need pieces, Tardisodes, and so on) have no story number. Not every one of them is canonical, so they are opt-in: `parseStories` emits a number-less row only if its page link target is in the exported, human-curated `NUMBER_LESS_STORY_ALLOWLIST` (a `ReadonlySet<string>` beside `NON_MERGING_STORY_GROUPS`; editorial data, not derivable from the wiki). Everything not on the list stays out of the database. To add one, append the row's page link target (e.g. `"Born Again (TV story)"`, not the display text) to the set; a test fails if an entry no longer matches a row on the list page. Number-less rows have their own shape: the third cell is a running time (`3 minutes`) for a minisode but an episode count (`6`) for an animated serial, which `extractNumberLessEpisodeCount` resolves (a running time counts as one episode; titles like `Pond Life (5 Parts)` stay one story). They have no season heading (`seasonName` is absent), take their era from the `== <Ordinal> Doctor ==` section as usual, are never letter-merged, and are de-duplicated by `(title, eraId)`. In the database that identity is a partial unique index on `stories (title, era_id) WHERE story_number IS NULL`, and `seed-03` upserts them with `ON CONFLICT (title, era_id) WHERE story_number IS NULL`.

**Page links.** Each `ParsedStory` and each `ParsedStoryPart` carries `pageTitle`: the wiki page the title cell links to (the link target, not the display text, with any `#section` anchor dropped; for example `Rose (TV story)` or `Shada (webcast)`). It is absent when the title cell has no link. For a merged lettered story, the story's own `pageTitle` is the first part's and each entry in `parts` has its own.

`buildEpisodeRows(story: ParsedStory)` is the pure function seed scripts call to turn one `ParsedStory` into the episode rows to insert — it's the seam between parsing and the database:

- If `story.parts` is set (lettered two-parter), each part becomes one episode row with its own title/air date.
- Else if `episodeCount > 1` (classic multi-part), synthesize `episodeCount` rows sharing the story title; only part 1 carries the air date.
- Otherwise, one row using the story's own title/air date. Part number is absent for standalone episodes.

## Seed scripts (`api/seeds/seed-NN-*.ts`)

Each seed script reads the wiki JSON, calls the matching parser, then upserts rows via `ON CONFLICT ... DO UPDATE` — re-running a seed script updates existing rows instead of duplicating them.

The `NN` prefix is a dependency order, not just a naming convention:

1. `seed-01-eras.ts` — must run first; `seasons` and `episodes` both reference `era_id`.
2. `seed-02-seasons.ts` — depends on eras existing.
3. `seed-03-episodes.ts` — depends on eras and seasons existing. It has two story upsert paths: numbered stories conflict on `story_number`, number-less stories conflict on the partial `(title, era_id)` index.

`api/seeds/seed.ts` runs every `seed-NN-*.ts` file in the directory in numeric order (`pnpm api:seed`). Run one in isolation with `pnpm api:seed:eras` / `pnpm api:seed:seasons` / `pnpm api:seed:episodes` — useful when iterating on a single parser without re-running the whole chain.

## Relationship to migrations

Migrations (`api/migrations/*.sql`, applied via `pnpm api:migrate:up`) define the schema seed scripts insert into. When a schema change affects a table a seed script writes to (a new column, a changed constraint), the seed script — and often the parser feeding it — needs a matching update in the same change. A migration that lands without its corresponding seed/parser update will make `pnpm api:seed` fail or silently write incomplete rows.
