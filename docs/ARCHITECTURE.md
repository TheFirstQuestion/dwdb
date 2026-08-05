# dwdb — Architecture

Describes the current structure of the repo — what runs, how the pieces fit together. See [GOALS.md](GOALS.md) for why this exists, and [DATA_PIPELINE.md](DATA_PIPELINE.md) for how wiki source data becomes seeded rows (a separate, offline concern from what's described here).

> This is a living document: it should be updated in the same change that alters module structure, `src/basic/`, or `src/plugins/` — not left to drift from the code it describes.

This document describes the codebase **as it exists today**: a single Fastify app in one package. A monorepo restructuring (splitting out a UI package) is a stated future goal — see [GOALS.md](GOALS.md#future-scope) — but has no design yet and isn't reflected below.

## Overview

dwdb is a [Fastify](https://fastify.dev) HTTP API, using [TypeBox](https://github.com/sinclairzx81/typebox) for request/response schemas and [postgres.js](https://github.com/porsager/postgres) as the Postgres client. Each domain (eras, seasons, episodes, ...) is a self-contained module under `src/modules/`, all built on a shared foundation in `src/basic/`. Cross-cutting concerns (the DB connection, Swagger UI) are registered as Fastify plugins in `src/plugins/`.

`src/index.ts` wires it all together: register plugins, register each module's routes, listen.

## Shared foundation (`src/basic/`)

Every module builds on four shared pieces:

- **`BaseRepository<TRow>`** — generic CRUD over a single table (`findAll`, `findById`, `findAllPaginated`). Modules extend it and `override` methods when they need joins (e.g. `EraRepository` joins `people` for the actor name) or filters (e.g. `EpisodeRepository` filters by `era_id`/`season_id`).
- **`BaseService<TRepo>`** — thin wrapper holding a repository instance; modules extend it to add pagination/response-shaping logic on top of raw repository results.
- **`BasicSchemas.ts`** — shared response schemas, currently just `ErrorMessage` (`{ error: string }`) for 404s.
- **`Pagination.ts`** — the pagination contract used everywhere: `paginationQuery` (TypeBox schema for `pageNum`/`perPage` query params), `resolvePagination` (applies defaults), `paginationOffset`, `toPaginatedResult`, and `Paginated(item)` (wraps a TypeBox schema in the `{ data, total, pageNum, perPage, totalPages }` envelope used by every list endpoint).

A module can be understood without reading `src/basic/` internals — the contract is "extend `BaseRepository`/`BaseService`, override what's table-specific." Changing internals of the base classes (e.g. how pagination counts are computed) doesn't require touching module code, as long as the method signatures hold.

## Module anatomy

Every module under `src/modules/<name>/` has the same four files, each with one job:

| File | Job |
| --- | --- |
| `<name>.schema.ts` | TypeBox schemas: the row shape, path params, querystring. Exports the `Static<>` row type other files import. |
| `<name>.repository.ts` | Extends `BaseRepository`, talks to Postgres directly. Overrides `findAllPaginated`/`findById` when the table needs joins or filters. |
| `<name>.service.ts` | Extends `BaseService`, calls the repository, applies pagination math (`toPaginatedResult`). Business logic lives here, not in routes or repository. |
| `<name>.routes.ts` | Fastify route handlers. Instantiates `service = new <Name>Service(new <Name>Repository(fastify.db))`, wires each route's schema (imported from `<name>.schema.ts`, never inlined) to a handler that calls the service. |

**Worked example — `episodes`:**

- `episode.schema.ts` defines `Episode` (the row), `EpisodeIdParam`, and `EpisodeQuerystring` (pagination + optional `era_id`/`season_id` filters, composed via `Type.Composite([paginationQuery, ...])`).
- `episode.repository.ts` overrides `findAllPaginated` to filter by `era_id`/`season_id` when present, and `findById` to select the same explicit column set (episodes cast `air_date` to text).
- `episode.service.ts`'s `getAll` resolves pagination, calls the repository, wraps the result with `toPaginatedResult`; `getById` passes straight through.
- `episode.routes.ts` registers `GET /episodes` (paginated list, schema-validated querystring, `200: Paginated(Episode)`) and `GET /episodes/:id` (`200: Episode`, `404: ErrorMessage`).

`eras` and `seasons` follow the identical shape — `eras` overrides `findAll`/`findById` to join `people` for the actor name; `seasons` overrides `findAllPaginated`/`findById` to filter by `era_id`. Adding a new domain module means copying this four-file shape, not inventing a new one.

## Plugins (`src/plugins/`)

Registered once in `src/index.ts`, before any routes:

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
