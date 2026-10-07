# Wipe database and re-pull data

Steps to fully reset the local Postgres database and re-run the wiki data pull and
seed pipeline from scratch.

## 1. Wipe the database

The Postgres container stores data in the named Docker volume
`dwdb_postgres_data` (declared in `docker-compose.yml`). Tearing down with
`-v` removes the volume and all data with it.

```sh
docker compose down -v
docker compose up -d
```

Wait for Postgres to be ready before migrating (a few seconds). You can check
with:

```sh
docker compose logs -f postgres
```

(Ctrl-C once you see `database system is ready to accept connections`.)

## 2. Re-download wiki source data (optional)

Only needed if you want fresh wiki content, not just a database reset. This
overwrites `api/wiki-data/pages/List_of_Doctor_Who_television_stories.json`.

```sh
pnpm api:wiki:download          # full page fetch
# or
pnpm api:wiki:download:test     # capped to 50 pages, faster iteration
```

## 3. Run migrations

```sh
pnpm api:migrate:up
```

## 4. Re-seed

```sh
pnpm api:seed
```

This runs all `seed-NN-*.ts` scripts in `api/seeds/` in order (eras → seasons
→ episodes). Seeds upsert via `ON CONFLICT ... DO UPDATE`, so this is safe to
re-run, but since step 1 wiped the DB this will populate from empty.

Individual seeds can be run standalone if needed:

```sh
pnpm api:seed:eras
pnpm api:seed:seasons
pnpm api:seed:episodes
```

## One-liner

Once the containers are back up and Postgres is accepting connections:

```sh
pnpm api:migrate:up && pnpm api:seed
```
