import type postgres from "postgres";

import { ErrorMessage } from "./ErrorMessage.js";
import type { PaginationOffset, RowsWithTotal } from "./Pagination.js";

export abstract class BaseRepository<TRow extends object> {
	constructor(
		protected db: postgres.Sql,
		protected table: string
	) {}

	async findAll(): Promise<TRow[]> {
		return this.db<TRow[]>`SELECT * FROM ${this.db(this.table)}`;
	}

	async findById(id: number): Promise<TRow | ErrorMessage> {
		const [row] = await this.db<TRow[]>`
      SELECT * FROM ${this.db(this.table)} WHERE id = ${id}
    `;
		if (row !== undefined) {
			return row;
		}
		return new ErrorMessage(
			`No row found in ${this.table} with id='${id}'`,
			404
		);
	}

	async findAllPaginated(
		options: PaginationOffset
	): Promise<RowsWithTotal<TRow>> {
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
