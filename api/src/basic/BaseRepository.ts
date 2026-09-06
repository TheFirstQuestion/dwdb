import type postgres from "postgres";

import type { RowsWithTotal } from "./Pagination.js";

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

	async findAllPaginated(options: {
		limit: number;
		offset: number;
	}): Promise<RowsWithTotal<TRow>> {
		const { limit, offset } = options;
		const rows = await this.db<TRow[]>`
      SELECT * FROM ${this.db(this.table)}
      LIMIT ${limit} OFFSET ${offset}
    `;
		const countResult = await this.db<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM ${this.db(this.table)}
    `;
		if (!countResult[0]) {
			throw new Error(`Failed to retrieve count for ${this.table}`);
		}
		const { count } = countResult[0];
		return { rows, total: Number(count) };
	}
}
