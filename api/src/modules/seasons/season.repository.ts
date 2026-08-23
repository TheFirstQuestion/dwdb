import type postgres from "postgres";

import { type SeasonRow } from "@/types/seasons.schema.js";

import { BaseRepository } from "../../basic/BaseRepository.js";

export class SeasonRepository extends BaseRepository<SeasonRow> {
	constructor(db: postgres.Sql) {
		super(db, "seasons");
	}

	override async findAllPaginated(options: {
		limit: number;
		offset: number;
		eraId?: number;
	}): Promise<{ rows: SeasonRow[]; total: number }> {
		const { eraId, limit, offset } = options;

		const filters = [];
		if (eraId !== undefined) filters.push(this.db`era_id = ${eraId}`);
		const where = filters.length
			? this.db`WHERE ${filters.reduce((acc, f) => this.db`${acc} AND ${f}`)}`
			: this.db``;

		const rows = await this.db<SeasonRow[]>`
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

	override async findById(id: number): Promise<SeasonRow | null> {
		const [season] = await this.db<SeasonRow[]>`
      SELECT id, era_id, number, name, year
      FROM seasons
      WHERE id = ${id}
    `;
		return season ?? null;
	}
}
