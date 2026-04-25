import type postgres from 'postgres'

export abstract class BaseRepository {
  constructor(protected db: postgres.Sql) {}
}
