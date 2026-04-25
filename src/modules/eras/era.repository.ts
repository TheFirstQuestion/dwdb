import type postgres from "postgres";
import { BaseRepository } from "../../basic/BaseRepository.js";
import { type EraRow } from "./era.schema.js";

export class EraRepository extends BaseRepository<EraRow> {
	constructor(db: postgres.Sql) {
		super(db, "eras");
	}

	override async findAll(): Promise<EraRow[]> {
		return this.db<EraRow[]>`
      SELECT e.id, p.name AS actor, e.start_year, e.end_year
      FROM eras e
      JOIN people p ON p.id = e.actor_id
      ORDER BY e.id
    `;
	}

	override async findById(id: number): Promise<EraRow | null> {
		const [era] = await this.db<EraRow[]>`
      SELECT e.id, p.name AS actor, e.start_year, e.end_year
      FROM eras e
      JOIN people p ON p.id = e.actor_id
      WHERE e.id = ${id}
    `;
		return era ?? null;
	}
}
