# dwdb — Project Goals

A living reference for what dwdb is trying to accomplish and for whom. See [README.md](../README.md) for the elevator pitch and [ARCHITECTURE.md](ARCHITECTURE.md) / [DATA_PIPELINE.md](DATA_PIPELINE.md) for how it's built.

## Purpose

TVDB (and tools built on it, like Plex, Sonarr, Trakt) doesn't model Doctor Who well: specials get dumped into an awkward Season 0, multi-part classic stories have no first-class representation, and spin-offs have no cross-reference back to the parent show.

dwdb maintains its own canonical episode/story database with organization logic that actually fits the show (eras, seasons, multi-part stories, story arcs), and exposes it as a REST API. A TVDB mapping layer lets Plex-compatible tools keep resolving IDs against dwdb's canonical data.

dwdb is also a toy project in the deliberate sense: learning and growing as a developer is a key goal alongside the Doctor Who data itself. Where a choice trades a shortcut against practicing a software engineering skill or feeling a real pain point firsthand, prefer the latter.

## Personas

- **API consumer** — an application or script (a Plex/Sonarr integration, a future frontend, an ad-hoc query) that reads dwdb data over HTTPS.
- **Maintainer** (you) — seeds and corrects data, evolves the schema, fixes parser bugs as wiki source data changes or new episodes air. Also the one using this project to practice and learn.
- **Viewer** (future) — a person using a UI built on top of the API. The UI's first purpose is debugging/sanity-checking the API itself as it's built; fan-facing browsing is the longer-term face of the same UI.

## User stories

Starter set, grouped by persona, describing what the whole API is for — not just what's implemented today. Raw material for later epic breakdown, not an exhaustive backlog.

### API consumer

- As an API consumer, I want to resolve a story between identifier systems (TVDB ID, DVD/Blu-ray release ID, wiki title), so that I can cross-reference dwdb data regardless of which system I started from.
- As an API consumer, I want to traverse relationships that aren't typical of TV shows — story arcs, multi-Doctor crossovers — so that I can build "explore" features TVDB has no model for.
- As an API consumer, I want to look up the production credits (writer, director, producer, showrunner, script editor) for a story, so that I can build crew-based views (e.g. "everything written by X").
- As an API consumer, I want to look up the cast of a story (actor + character/incarnation), so that I can cross-reference performers across appearances.
- As an API consumer, I want to find behind-the-scenes content (Doctor Who Confidential, DVD extras, YouTube clips) linked to a season, episode, or air date, so that I can surface supplementary material even when it isn't tied to one specific episode.
- As an API consumer, I want to list episodes filtered by era or season, so that I can build era/season-scoped views without fetching everything.
- As an API consumer, I want paginated responses with total counts, so that I can build UI pagers without a second count query.
- As an API consumer, I want human- and machine-readable, self-describing API docs (OpenAPI/Swagger), so that I can generate a client or explore the whole API surface without reading source code.
- As an API consumer, I want to run endpoints using a UI (OpenAPI/Swagger), so that I can test them manually and get a feel for the data.
- As an API consumer, I want to get episodes from the main show and spin-offs in air date order, so I can display the proper watching order.

### Maintainer

- As a maintainer, I want to re-run a single seed script after fixing a parser bug, so that I don't have to re-seed the entire database to test a fix.
- As a maintainer, I want seed scripts to be idempotent (safe to re-run), so that re-seeding after a wiki data update doesn't produce duplicate rows.
- As a maintainer, I want new migrations and seeds to fail loudly on bad input, so that malformed wiki data doesn't silently corrupt the canonical dataset.
- As a maintainer, I want each domain module to follow the same repository/service/routes/schema shape, so that adding a new domain (arcs, people-as-crew, DVD releases) is mechanical rather than a design decision.
- As a maintainer, I want solid test coverage on parsers and services, so that I learn how to make broad changes with confidence.
- As a maintainer, I want to work through real schema evolution (many-to-many arcs, people playing multiple roles, multi-source mappings) using proper migrations, so that I get hands-on practice with database design under real constraints, not toy exercises.
- As a maintainer, I want to hit real API design tradeoffs (pagination, filtering, versioning) firsthand, so that I learn what good REST API design actually costs, not just what it looks like in a tutorial.

### Viewer (future UI)

- As a developer, I want a minimal UI that renders raw API responses (pagination, filters, 404s), so that I can sanity-check the API without curling every endpoint by hand.
- As a developer, I want the UI to exercise every consumer-facing capability (identity resolution, relationships, credits, behind-the-scenes content) as each is built, so that the UI itself becomes a running integration check on the API surface.
- As a viewer, I want to browse stories grouped by Doctor era, so that I can watch through a specific Doctor's run.
- As a viewer, I want to see which arcs and crossovers a story belongs to, so that serialized plots (e.g. Bad Wolf) and multi-Doctor stories aren't confusing.
- As a viewer, I want to see the spin-offs interwoven with the main show so that crossovers maintain continuity.

## Non-goals

- **Not a general TV database.** dwdb models Doctor Who's specific structure (eras, multi-part classic stories, arcs); it isn't trying to be a reusable schema for arbitrary shows.
- **Not a general filmography/bio database.** People (actors, writers, directors, producers) are scoped to their Doctor Who roles, not broader career or biographical data.
- **Not a Plex plugin.** dwdb exposes data Plex-compatible tools *can* consume via mapping layers; it doesn't integrate with Plex directly.

## Future scope

Concrete areas known to be out of scope for now but intended eventually:

- **Monorepo with a UI package** alongside the API — significant enough to warrant its own design process (package boundaries, tooling, migration steps) rather than being detailed here; see [ARCHITECTURE.md](ARCHITECTURE.md) once that plan exists.
- **Production credits as people** — writers, directors, producers, showrunners, script editors modeled the same way as actors (the existing `people` entity), just with a different role.
- **Behind-the-scenes content** (DVD extras, YouTube clips) — linkable to a season, episode, or air date rather than always requiring one specific episode.
- **Additional mapping layers** beyond TVDB — e.g. browsing by DVD/Blu-ray releases.

## Roadmap direction

**Near-term:** finish seeding and API coverage for the core show — eras (done), seasons (done), episodes (in progress), story arcs (not started), TVDB mapping (not started).

**Also near-term:** a codebase setup/cleanup pass — adopt conventional commits, ~~review and tighten TypeScript rules~~ (done: enabled `noUncheckedIndexedAccess` and fixed all violations), review the ESLint config, and do a manual read-through of the code (not just automated tooling).

**Longer-term:** the items in [Future scope](#future-scope) above, roughly in the order listed.
