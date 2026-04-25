import type postgres from "postgres";

export abstract class BaseRepository<TRow extends object> {
	constructor(
		protected db: postgres.Sql,
		protected table: string
	) {}

	async findAll(): Promise<TRow[]> {
		return this.db<TRow[]>`SELECT * FROM ${this.db(this.table)}`;
	}

	async findById(id: number): Promise<TRow | null> {
		const [row] = await this.db<TRow[]>`
      SELECT * FROM ${this.db(this.table)} WHERE id = ${id}
    `;
		return row ?? null;
	}
}
