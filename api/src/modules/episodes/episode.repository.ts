import type postgres from "postgres";

import { type Episode } from "@/types/episodes.schema.js";

import { BaseRepository } from "../../basic/BaseRepository.js";

export class EpisodeRepository extends BaseRepository<Episode> {
	constructor(db: postgres.Sql) {
		super(db, "episodes");
	}

	override async findAllPaginated(options: {
		limit: number;
		offset: number;
		eraId?: number;
		seasonId?: number;
	}): Promise<{ rows: Episode[]; total: number }> {
		const { eraId, seasonId, limit, offset } = options;

		const filters = [];
		if (eraId !== undefined) filters.push(this.db`era_id = ${eraId}`);
		if (seasonId !== undefined) filters.push(this.db`season_id = ${seasonId}`);
		const where = filters.length
			? this.db`WHERE ${filters.reduce((acc, f) => this.db`${acc} AND ${f}`)}`
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

	override async findById(id: number): Promise<Episode | null> {
		const [episode] = await this.db<Episode[]>`
      SELECT id, story_id, era_id, season_id, title,
             air_date::text AS air_date, part_number
      FROM episodes
      WHERE id = ${id}
    `;
		return episode ?? null;
	}
}
