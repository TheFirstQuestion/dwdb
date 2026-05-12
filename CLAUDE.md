# dwdb

Doctor Who episode database API.

## Stack
- Fastify + TypeBox + @fastify/swagger
- postgres (postgresjs) client
- node-pg-migrate for migrations
- Postgres 16 via Docker

## Rules
- No TypeScript non-null assertions (`!`). Throw an explicit error or handle the missing value properly.
- All TypeBox schemas (params, body, response, 404s) must be defined in the module's schema file and imported into routes — no inline `Type.Object({...})` in route handlers.
- Future-proof: never hardcode finite lists of domain entities that will grow as the show continues (e.g. a fixed map of Doctor names). Derive values algorithmically instead.
- Before committing: code must type-check cleanly (`pnpm build`), lint cleanly (`pnpm lint`), be formatted (`pnpm format`), and all tests must pass (`pnpm test`).

## Seeding

Run in order — each step depends on the previous:

```
pnpm migrate:up     # apply all migrations
pnpm seed           # run all seed-NN-*.ts scripts in seeds/ in order
```

Individual seeds (run standalone if needed): `pnpm seed:eras`, `pnpm seed:seasons`

To add a new seed: create `seeds/seed-NN-name.ts` — it runs automatically in numeric order.

Source data: `wiki-data/pages/List_of_Doctor_Who_television_stories.json`
Download with `pnpm wiki:download` (or `pnpm wiki:download:test` for a 50-page sample).

## Data conventions
- `doctor_id` on an episode refers to the Doctor's incarnation at the **start** of the episode. Regeneration episodes belong to the outgoing Doctor (e.g. "The Tenth Planet" → First Doctor, "End of Time" → Tenth Doctor).
- The `eras` table `id` aligns with the canonical Doctor number. David Tennant has two rows: id=10 and id=14. `actor_id` references `people`.
- A story belongs to a single era. For multi-Doctor stories, use the **broadcast year** to determine era (e.g. "The Day of the Doctor" aired 2013 → Eleventh Doctor era, id=11).
- A story can belong to zero or more arcs via the `story_arcs` junction table.
