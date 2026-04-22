# dwdb

Doctor Who episode database API.

## Stack
- Fastify + TypeBox + @fastify/swagger
- postgres (postgresjs) client
- node-pg-migrate for migrations
- Postgres 16 via Docker

## Rules
- No TypeScript non-null assertions (`!`). Throw an explicit error or handle the missing value properly.

## Data conventions
- `doctor_id` on an episode refers to the Doctor's incarnation at the **start** of the episode. Regeneration episodes belong to the outgoing Doctor (e.g. "The Tenth Planet" → First Doctor, "End of Time" → Tenth Doctor).
- The `eras` table `id` aligns with the canonical Doctor number. David Tennant has two rows: id=10 and id=14. `actor_id` references `people`.
- A story belongs to a single era. For multi-Doctor stories, use the **broadcast year** to determine era (e.g. "The Day of the Doctor" aired 2013 → Eleventh Doctor era, id=11).
- A story can belong to zero or more arcs via the `story_arcs` junction table.
