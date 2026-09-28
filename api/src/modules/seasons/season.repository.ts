import type postgres from "postgres";

import { type Season, type SeasonFilter } from "@/types/seasons.schema.js";

import { BaseRepository } from "../../basic/BaseRepository.js";
import { ErrorMessage } from "../../basic/ErrorMessage.js";
import type {
	PaginationOffset,
	RowsWithTotal,
} from "../../basic/Pagination.js";

export class SeasonRepository extends BaseRepository<Season> {
	constructor(db: postgres.Sql) {
		super(db, "seasons");
	}

	async findAllByEraIdPaginated(
		eraId: number,
		options: PaginationOffset
	): Promise<RowsWithTotal<Season>> {
		return this.findAllWithFiltersPaginated(
			[{ column: "era_id", value: eraId }],
			options
		);
	}

	async findAllWithFiltersPaginated(
		filters: SeasonFilter[],
		options: PaginationOffset
	): Promise<RowsWithTotal<Season>> {
		const { limit, offset } = options;

		const conditions = filters.map(
			(filter) => this.db`${this.db(filter.column)} = ${filter.value}`
		);
		const where = conditions.length
			? this
					.db`WHERE ${conditions.reduce((acc, c) => this.db`${acc} AND ${c}`)}`
			: this.db``;

		const rows = await this.db<Season[]>`
      SELECT id, era_id, number, name, year
      FROM seasons
      ${where}
      ORDER BY year, number
      LIMIT ${limit} OFFSET ${offset}
    `;
		const countResult = await this.db<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM seasons ${where}
    `;
		if (!countResult[0]) {
			throw new Error("Failed to retrieve count for seasons");
		}
		const { count } = countResult[0];
		return { rows, total: Number(count) };
	}

	override async findById(id: number): Promise<Season | ErrorMessage> {
		const [season] = await this.db<Season[]>`
      SELECT id, era_id, number, name, year
      FROM seasons
      WHERE id = ${id}
    `;
		if (season !== undefined) {
			return season;
		}
		return new ErrorMessage(`No season found with id='${id}'`, 404);
	}
}
