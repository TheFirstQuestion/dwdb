# dwdb — Architecture

Describes the current structure of the repo — what runs, how the pieces fit together. See [GOALS.md](GOALS.md) for why this exists, and [DATA_PIPELINE.md](DATA_PIPELINE.md) for how wiki source data becomes seeded rows (a separate, offline concern from what's described here).

> This is a living document: it should be updated in the same change that alters module structure, `api/src/basic/`, or `api/src/plugins/` — not left to drift from the code it describes.

This document describes the codebase **as it exists today**: the Fastify app lives under `api/`, with shared TypeBox schemas centralized in `types/` at the repo root so a future frontend package can import the same schema types. A full monorepo split (an actual UI package alongside `api/`) is a stated future goal — see [GOALS.md](GOALS.md#future-scope) — but doesn't exist yet.

## Overview

dwdb is a [Fastify](https://fastify.dev) HTTP API, using [TypeBox](https://github.com/sinclairzx81/typebox) for request/response schemas and [postgres.js](https://github.com/porsager/postgres) as the Postgres client. Each domain (eras, seasons, episodes, ...) is a self-contained module under `api/src/modules/`, all built on a shared foundation in `api/src/basic/`. Cross-cutting concerns (the DB connection, Swagger UI) are registered as Fastify plugins in `api/src/plugins/`.

`api/src/index.ts` wires it all together: register plugins, register each module's routes, listen.

## Shared foundation (`api/src/basic/`)

Every module builds on four shared pieces:

- **`BaseRepository<TRow>`** — generic CRUD over a single table (`findAll`, `findById`, `findAllPaginated`). Modules extend it and `override` methods when they need joins (e.g. `EraRepository` joins `people` for the actor name) or filters (e.g. `EpisodeRepository` filters by `era_id`/`season_id`).
- **`BaseService<TRepo>`** — thin wrapper holding a repository instance; modules extend it to add pagination/response-shaping logic on top of raw repository results.
- **`BasicSchemas.ts`** — shared response schemas, currently just `ErrorMessage` (`{ error: string }`) for 404s.
- **`Pagination.ts`** — the pagination contract used everywhere: `resolvePagination` (applies defaults), `paginationOffset`, `toPaginatedResult`, and `Paginated(item)` (wraps a TypeBox schema in the `{ data, total, pageNum, perPage, totalPages }` envelope used by every list endpoint). The request-side querystring schema (`paginationQuery`) lives in `types/pagination.schema.ts` instead — see "Shared schemas (`types/`)" below — since schema files under `types/` need it too; `Pagination.ts` imports the pieces it needs (`pageNumSchema`, `perPageSchema`, `PaginationQuery`) from there.

A module can be understood without reading `api/src/basic/` internals — the contract is "extend `BaseRepository`/`BaseService`, override what's table-specific." Changing internals of the base classes (e.g. how pagination counts are computed) doesn't require touching module code, as long as the method signatures hold.

## Module anatomy

Every module under `api/src/modules/<name>/` has the same three files, each with one job:

| File | Job |
| --- | --- |
| `<name>.repository.ts` | Extends `BaseRepository`, talks to Postgres directly. Overrides `findAllPaginated`/`findById` when the table needs joins or filters. |
| `<name>.service.ts` | Extends `BaseService`, calls the repository, applies pagination math (`toPaginatedResult`). Business logic lives here, not in routes or repository. |
| `<name>.routes.ts` | Fastify route handlers. Instantiates `service = new <Name>Service(new <Name>Repository(fastify.db))`, wires each route's schema (imported from `types/`, never inlined) to a handler that calls the service. |

The module's TypeBox schemas live outside this three-file set — see "Shared schemas (`types/`)" below.

**Worked example — `episodes`:**

- `types/episodes.schema.ts` defines `Episode` (the row), `EpisodeIdParam`, and `EpisodeQuerystring` (pagination + optional `era_id`/`season_id` filters, composed via `Type.Composite([paginationQuery, ...])`).
- `api/src/modules/episodes/episode.repository.ts` overrides `findAllPaginated` to filter by `era_id`/`season_id` when present, and `findById` to select the same explicit column set (episodes cast `air_date` to text).
- `api/src/modules/episodes/episode.service.ts`'s `getAll` resolves pagination, calls the repository, wraps the result with `toPaginatedResult`; `getById` passes straight through.
- `api/src/modules/episodes/episode.routes.ts` registers `GET /episodes` (paginated list, schema-validated querystring, `200: Paginated(Episode)`) and `GET /episodes/:id` (`200: Episode`, `404: ErrorMessage`), importing its schemas from `types/episodes.schema.ts`.

`eras` and `seasons` follow the identical shape — `eras` overrides `findAll`/`findById` to join `people` for the actor name; `seasons` overrides `findAllPaginated`/`findById` to filter by `era_id`. Adding a new domain module means copying this three-file shape (plus its `types/<module>.schema.ts` counterpart), not inventing a new one.

## Shared schemas (`types/`)

TypeBox schemas for every module live in `types/<module>.schema.ts` at the repo root (e.g. `types/episodes.schema.ts`), not alongside the module's other files under `api/src/modules/<name>/`. They're centralized here specifically so a future frontend package can import the same schema types the API uses, without depending on `api/`'s internals. Modules import their schemas via the `@/types/*` path alias (e.g. `import { Episode } from '@/types/episodes.schema.js'`) into `<name>.routes.ts` and `<name>.repository.ts`.

`types/pagination.schema.ts` holds the shared request-side pagination pieces (`paginationQuery`, `pageNumSchema`, `perPageSchema`, and their defaults) that both the module querystring schemas (via `Type.Composite([paginationQuery, ...])`) and `api/src/basic/Pagination.ts` depend on. This keeps the dependency direction one-way — `api/src/` depends on `types/`, never the reverse — so `types/` stays genuinely importable by a future frontend without pulling in API internals.

## Plugins (`api/src/plugins/`)

Registered once in `api/src/index.ts`, before any routes:

- **`cors.ts`** — registers `@fastify/cors`, allowing local dev origins (`http://localhost:3000`, `http://localhost:3001`) so the Nuxt frontend (`frontend/`) can fetch the API in dev without a CORS error. Registered first, before `db`/`swagger`. Local-dev-only for now; a production frontend origin (e.g. GitHub Pages) still needs to be added once one exists.
- **`db.ts`** — creates the `postgres.Sql` client from `DATABASE_URL`, decorates `fastify.db` so every module's routes can construct a repository, and closes the connection on server shutdown (`onClose` hook).
- **`swagger.ts`** — registers `@fastify/swagger` (OpenAPI generation from the TypeBox schemas modules already define) and `@fastify/swagger-ui` at `/docs`.

## Current module inventory

| Module | Status |
| --- | --- |
| `eras` | Implemented — list/get, joins `people` for actor name |
| `seasons` | Implemented — list/get, paginated, filterable by `era_id` |
| `episodes` | Implemented — list/get, paginated, filterable by `era_id`/`season_id` |
| story arcs | Not started (see [GOALS.md](GOALS.md)) |
| TVDB mapping | Not started (see [GOALS.md](GOALS.md)) |
