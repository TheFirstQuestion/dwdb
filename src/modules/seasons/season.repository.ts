import type postgres from "postgres";
import { BaseRepository } from "../../basic/BaseRepository.js";
import { type SeasonRow } from "./season.schema.js";

export class SeasonRepository extends BaseRepository<SeasonRow> {
	constructor(db: postgres.Sql) {
		super(db, "seasons");
	}

	override async findAll(eraId?: number): Promise<SeasonRow[]> {
		if (eraId !== undefined) {
			return this.db<SeasonRow[]>`
        SELECT id, era_id, number, name, year
        FROM seasons
        WHERE era_id = ${eraId}
        ORDER BY year, number
      `;
		}
		return this.db<SeasonRow[]>`
      SELECT id, era_id, number, name, year
      FROM seasons
      ORDER BY year, number
    `;
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
