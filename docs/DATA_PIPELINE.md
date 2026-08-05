# dwdb — Data Pipeline

How wiki source data becomes seeded database rows. This is offline prep/tooling work — it runs against your local Postgres before the API ever serves a request, separately from the runtime architecture described in [ARCHITECTURE.md](ARCHITECTURE.md).

> This is a living document: it should be updated in the same change that alters migrations, parsers, or seed scripts — not left to drift from the code it describes.

## Overview

The pipeline has four stages, run in order:

```text
wiki-data (JSON) → parsers (seeds/*-parser.ts) → seed scripts (seeds/seed-NN-*.ts) → Postgres
```

Migrations must be applied before seeding — seed scripts insert into tables the migrations create.

## Source

`wiki-data/pages/List_of_Doctor_Who_television_stories.json` is a raw MediaWiki API dump: page revisions with wikitext in `query.pages[...].revisions[0].slots.main["*"]`. Every parser reads this same file and extracts the wikitext before parsing.

Download or refresh it with:

- `pnpm wiki:download` — full page fetch
- `pnpm wiki:download:test` — capped to 50 pages (`MAX_PAGES=50`), for faster iteration

## Parsers (`seeds/*-parser.ts`)

Pure functions that take wikitext and return typed rows — no database access, no side effects. Each is scoped to one concern:

- **`era-parser.ts`** — extracts Doctor eras: actor name, incarnation id, start/end year.
- **`season-parser.ts`** — extracts seasons/series: number, name, year, which era they belong to.
- **`episode-parser.ts`** — extracts individual episodes/stories: title, air date, part number, story grouping.

Being pure and side-effect-free is what makes these independently testable (see `tests/episode-parser.test.ts`) without a database — a parser bug can be reproduced and fixed with a unit test alone.

## Seed scripts (`seeds/seed-NN-*.ts`)

Each seed script reads the wiki JSON, calls the matching parser, then upserts rows via `ON CONFLICT ... DO UPDATE` — re-running a seed script updates existing rows instead of duplicating them.

The `NN` prefix is a dependency order, not just a naming convention:

1. `seed-01-eras.ts` — must run first; `seasons` and `episodes` both reference `era_id`.
2. `seed-02-seasons.ts` — depends on eras existing.
3. `seed-03-episodes.ts` — depends on eras and seasons existing.

`seeds/seed.ts` runs every `seed-NN-*.ts` file in the directory in numeric order (`pnpm seed`). Run one in isolation with `pnpm seed:eras` / `pnpm seed:seasons` / `pnpm seed:episodes` — useful when iterating on a single parser without re-running the whole chain.

## Relationship to migrations

Migrations (`migrations/*.sql`, applied via `pnpm migrate:up`) define the schema seed scripts insert into. When a schema change affects a table a seed script writes to (a new column, a changed constraint), the seed script — and often the parser feeding it — needs a matching update in the same change. A migration that lands without its corresponding seed/parser update will make `pnpm seed` fail or silently write incomplete rows.
