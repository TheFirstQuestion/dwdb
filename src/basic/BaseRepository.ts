import type postgres from "postgres";

export abstract class BaseRepository {
	constructor(
		protected db: postgres.Sql,
		protected table: string
	) {}

	async findAll<T>(): Promise<T[]> {
		return this.db<T[]>`SELECT * FROM ${this.db(this.table)}`;
	}

	async findById<T>(id: number): Promise<T | null> {
		const [row] = await this.db<T[]>`
      SELECT * FROM ${this.db(this.table)} WHERE id = ${id}
    `;
		return row ?? null;
	}
}
