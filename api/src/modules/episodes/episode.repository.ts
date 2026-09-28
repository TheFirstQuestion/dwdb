import type postgres from "postgres";

import { type Episode, type EpisodeFilter } from "@/types/episodes.schema.js";

import { BaseRepository } from "../../basic/BaseRepository.js";
import { ErrorMessage } from "../../basic/ErrorMessage.js";
import type {
	PaginationOffset,
	RowsWithTotal,
} from "../../basic/Pagination.js";

export class EpisodeRepository extends BaseRepository<Episode> {
	constructor(db: postgres.Sql) {
		super(db, "episodes");
	}

	async findAllByEraIdPaginated(
		eraId: number,
		options: PaginationOffset
	): Promise<RowsWithTotal<Episode>> {
		return this.findAllWithFiltersPaginated(
			[{ column: "era_id", value: eraId }],
			options
		);
	}

	async findAllBySeasonIdPaginated(
		seasonId: number,
		options: PaginationOffset
	): Promise<RowsWithTotal<Episode>> {
		return this.findAllWithFiltersPaginated(
			[{ column: "season_id", value: seasonId }],
			options
		);
	}

	async findAllWithFiltersPaginated(
		filters: EpisodeFilter[],
		options: PaginationOffset
	): Promise<RowsWithTotal<Episode>> {
		const { limit, offset } = options;

		const conditions = filters.map(
			(filter) => this.db`${this.db(filter.column)} = ${filter.value}`
		);
		const where = conditions.length
			? this
					.db`WHERE ${conditions.reduce((acc, c) => this.db`${acc} AND ${c}`)}`
			: this.db``;

		const rows = await this.db<Episode[]>`
      SELECT id, story_id, era_id, season_id, title,
             air_date::text AS air_date, part_number
      FROM episodes
      ${where}
      ORDER BY air_date NULLS LAST, id
      LIMIT ${limit} OFFSET ${offset}
    `;
		const countResult = await this.db<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM episodes ${where}
    `;
		if (!countResult[0]) {
			throw new Error("Failed to retrieve count for episodes");
		}
		const { count } = countResult[0];
		return { rows, total: Number(count) };
	}

	override async findById(id: number): Promise<Episode | ErrorMessage> {
		const [episode] = await this.db<Episode[]>`
      SELECT id, story_id, era_id, season_id, title,
             air_date::text AS air_date, part_number
      FROM episodes
      WHERE id = ${id}
    `;
		if (episode === undefined) {
			return new ErrorMessage(`No episode found with id='${id}'`, 404);
		}
		return episode;
	}
}
