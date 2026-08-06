# dwdb

Doctor Who episode database API.

## Canonical documents

These are crucial context — read them before making anything more than a minor change:

- [`docs/GOALS.md`](docs/GOALS.md) — why this project exists, personas, user stories, non-goals, roadmap.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — current runtime structure of the repo. Living document.
- [`docs/DATA_PIPELINE.md`](docs/DATA_PIPELINE.md) — how wiki source data becomes seeded rows. Living document.

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
- Markdown files must lint cleanly (`pnpm lint:md`).
- Before committing any change to `migrations/` or `seeds/`: `pnpm migrate:up` and `pnpm migrate:down` must both succeed without error, and `pnpm seed` must run successfully against the freshly migrated database.
- `docs/ARCHITECTURE.md` and `docs/DATA_PIPELINE.md` are living documents. Any change touching module structure, `src/basic/`, `src/plugins/`, migrations, or the seed/parser pipeline must update the relevant doc in the same change.

## Seeding

Run in order — each step depends on the previous:

```sh
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

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `TheFirstQuestion/dwdb`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root (created lazily as needed). See `docs/agents/domain.md`.
