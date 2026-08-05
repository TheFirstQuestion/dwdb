import type postgres from "postgres";
import { BaseRepository } from "../../basic/BaseRepository.js";
import { type EpisodeRow } from "./episode.schema.js";

export class EpisodeRepository extends BaseRepository<EpisodeRow> {
	constructor(db: postgres.Sql) {
		super(db, "episodes");
	}

	override async findAllPaginated(options: {
		limit: number;
		offset: number;
		eraId?: number;
		seasonId?: number;
	}): Promise<{ rows: EpisodeRow[]; total: number }> {
		const { eraId, seasonId, limit, offset } = options;

		const filters = [];
		if (eraId !== undefined) filters.push(this.db`era_id = ${eraId}`);
		if (seasonId !== undefined) filters.push(this.db`season_id = ${seasonId}`);
		const where = filters.length
			? this.db`WHERE ${filters.reduce((acc, f) => this.db`${acc} AND ${f}`)}`
			: this.db``;

		const rows = await this.db<EpisodeRow[]>`
      SELECT id, story_id, era_id, season_id, title,
             air_date::text AS air_date, part_number
      FROM episodes
      ${where}
      ORDER BY air_date NULLS LAST, id
      LIMIT ${limit} OFFSET ${offset}
    `;
		const [{ count }] = await this.db<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM episodes ${where}
    `;
		return { rows, total: Number(count) };
	}

	override async findById(id: number): Promise<EpisodeRow | null> {
		const [episode] = await this.db<EpisodeRow[]>`
      SELECT id, story_id, era_id, season_id, title,
             air_date::text AS air_date, part_number
      FROM episodes
      WHERE id = ${id}
    `;
		return episode ?? null;
	}
}
