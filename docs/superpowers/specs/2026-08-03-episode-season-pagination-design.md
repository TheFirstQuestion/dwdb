# Pagination for `GET /episodes` and `GET /seasons`

## Goal

Add `pageNum`/`perPage` pagination to the `GET /episodes` and `GET /seasons`
list endpoints, without touching `GET /eras` (not requested).

## Response shape

Both endpoints return an envelope instead of a bare array:

```json
{
  "data": [ { "id": 1, "title": "..." } ],
  "total": 42,
  "pageNum": 1,
  "perPage": 25,
  "totalPages": 2
}
```

`total` and `totalPages` reflect the filtered result set (i.e. after
`era_id`/`season_id` filters are applied, before pagination is applied).

## Query params

- `pageNum`: integer, minimum 1, default 1.
- `perPage`: integer, minimum 1, maximum 100, default 25.

Both are validated by the existing TypeBox/AJV schema pipeline — out-of-range
values produce a 400, the same way `era_id: Type.Integer({ minimum: 1 })`
already behaves. No manual clamping logic is needed.

Existing filters (`era_id` on both endpoints, `season_id` on episodes) keep
working exactly as today, combined with pagination: filters narrow the
`WHERE` clause, pagination applies on top, `total` counts the filtered rows.

## Shared module: `src/basic/Pagination.ts`

New file, used by both modules (and available to future ones, e.g. `eras`):

```ts
export const paginationQuery = Type.Object({
  pageNum: Type.Integer({ minimum: 1, default: 1, description: "Page number (1-indexed)" }),
  perPage: Type.Integer({ minimum: 1, maximum: 100, default: 25, description: "Items per page" }),
});
export type PaginationParams = Static<typeof paginationQuery>;

export function Paginated<T extends TSchema>(item: T) {
  return Type.Composite([
    paginationQuery,
    Type.Object({
      data: Type.Array(item),
      total: Type.Integer({ minimum: 0 }),
      totalPages: Type.Integer({ minimum: 0 }),
    }),
  ]);
}

export interface PaginatedResult<T> extends PaginationParams {
  data: T[];
  total: number;
  totalPages: number;
}

export function paginationOffset(pagination: PaginationParams): number {
  return (pagination.pageNum - 1) * pagination.perPage;
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
): PaginatedResult<T> {
  return { ...pagination, data, total, totalPages: Math.ceil(total / pagination.perPage) };
}
```

## Repository layer

`EpisodeRepository`/`SeasonRepository` currently override `BaseRepository.findAll()`
with incompatible, filter-specific signatures, branching into 3-4 separate
queries (one per filter combination). Changing `findAll` to return
`{ rows, total }` would break the `override` relationship with
`BaseRepository.findAll(): Promise<TRow[]>` (incompatible return type), so
both repositories get a new method instead, `findAllPaginated`, and the old
`findAll` override is deleted (it has no other callers — confirmed via
grep — so nothing is left half-migrated).

`BaseRepository` gets a default `findAllPaginated`, mirroring the existing
default `findAll()`/`findById()` — unfiltered, generic over the table:

```ts
async findAllPaginated(options: {
  limit: number;
  offset: number;
}): Promise<{ rows: TRow[]; total: number }> {
  const { limit, offset } = options;
  const rows = await this.db<TRow[]>`
    SELECT * FROM ${this.db(this.table)}
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [{ count }] = await this.db<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM ${this.db(this.table)}
  `;
  return { rows, total: Number(count) };
}
```

`EpisodeRepository`/`SeasonRepository` override it to add their filters,
taking `{ eraId?, seasonId?, limit, offset }` and returning `{ rows, total }`.
This collapses today's branching into one query per case using postgres.js's
documented dynamic-filter idiom: an optional condition is `sql`` ` (an empty
fragment) when its filter isn't set, or `sql`era_id = ${eraId}`` when it is.

**On the injection concern raised in review:** this is safe. Every `${...}`
inside a postgres.js tagged template — including one nested inside another
fragment — is sent to Postgres as a bound parameter (`$1`, `$2`, ...), never
string-concatenated into the query text. That holds regardless of how deeply
the fragments are nested; it's postgres.js's own documented pattern for
optional filters (see `node_modules/postgres/README.md`, "Dynamic filters").
What was flagged as "hacky" is more likely the `WHERE 1=1` tautology trick
used to make appending `AND ...` fragments uniform — it's not unsafe, just
inelegant. This design instead builds a list of present filters and joins
them with `AND`, only emitting `WHERE` if the list is non-empty:

```ts
override async findAllPaginated(options: {
  limit: number;
  offset: number;
  eraId?: number;
  seasonId?: number;
}): Promise<{ rows: EpisodeRow[]; total: number }> {
  const { eraId, seasonId, limit, offset } = options;

  const filters = [];
  if (eraId !== undefined) filters.push(this.db`era_id = ${eraId}`);
  if (seasonId !== undefined) filters.push(this.db`season_id = ${seasonId}`);
  const where = filters.length
    ? this.db`WHERE ${filters.reduce((acc, f) => this.db`${acc} AND ${f}`)}`
    : this.db``;

  const rows = await this.db<EpisodeRow[]>`
    SELECT id, story_id, era_id, season_id, title,
           air_date::text AS air_date, part_number
    FROM episodes
    ${where}
    ORDER BY air_date NULLS LAST, id
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [{ count }] = await this.db<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM episodes ${where}
  `;
  return { rows, total: Number(count) };
}
```

`SeasonRepository.findAllPaginated` is the same shape with only the
`eraId` filter (a single-element `filters` array, same `where` logic).

## Service layer

```ts
async getAll(pagination: PaginationParams, eraId?: number, seasonId?: number) {
  const { rows, total } = await this.repo.findAllPaginated({
    eraId,
    seasonId,
    limit: pagination.perPage,
    offset: paginationOffset(pagination),
  });
  return toPaginatedResult(rows, total, pagination);
}
```

`pagination` is required and placed first, so `eraId`/`seasonId` stay
genuinely optional (`?`) without needing the `| undefined` workaround —
they're already last in the parameter list since they're the ones callers
may omit. `SeasonService.getAll` drops the `seasonId` param (seasons aren't
filtered by season).

Route handlers update their call sites to match this order, e.g.
`service.getAll({ pageNum: request.query.pageNum, perPage: request.query.perPage }, request.query.era_id, request.query.season_id)`.

## Route/schema layer

`EpisodeQuerystring`/`SeasonQuerystring` add `pageNum`/`perPage` by reusing
the whole `paginationQuery` schema via `Type.Composite`, rather than picking
out individual properties — that way a future change to `paginationQuery`
(e.g. a new field, a different max) propagates to every querystring that
composes it instead of needing to be copied by hand:

```ts
export const EpisodeQuerystring = Type.Composite([
  paginationQuery,
  Type.Object({
    era_id: Type.Optional(Type.Integer({ minimum: 1, description: "Filter by Doctor era" })),
    season_id: Type.Optional(Type.Integer({ minimum: 1, description: "Filter by season" })),
  }),
]);
```

`SeasonQuerystring` composes the same way with only `era_id`. Response schema
changes from `Type.Array(Episode)` / `Type.Array(Season)` to
`Paginated(Episode)` / `Paginated(Season)`.

## Testing

No route/DB integration test harness exists in this repo today (only parser
unit tests against fixture data). Per user decision, this feature adds unit
tests only, for the pure functions in `Pagination.ts`:

- `paginationOffset`: `{ pageNum: 1, perPage: 25 }` → offset 0, `{ pageNum: 3, perPage: 20 }` → offset 40, etc.
- `toPaginatedResult`: `totalPages` rounds up on partial last page, is 0 when
  `total` is 0, matches exactly on an even multiple.

Repository/route wiring is not covered by automated tests (consistent with
current coverage) — `pnpm build`/`pnpm lint` must still pass since
`findAllPaginated`'s callers are typed.

## Out of scope

- `GET /eras` pagination (not requested).
- DB/route integration tests (explicitly declined by user for this task).
