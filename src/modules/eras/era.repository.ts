import type postgres from "postgres";
import { BaseRepository } from "../../basic/BaseRepository.js";

export class EraRepository extends BaseRepository {
	constructor(db: postgres.Sql) {
		super(db, "eras");
	}

	async findAll() {
		return this.db`
      SELECT e.id, p.name AS actor, e.start_year, e.end_year
      FROM eras e
      JOIN people p ON p.id = e.actor_id
      ORDER BY e.id
    `;
	}

	async findById(id: number) {
		const [era] = await this.db`
      SELECT e.id, p.name AS actor, e.start_year, e.end_year
      FROM eras e
      JOIN people p ON p.id = e.actor_id
      WHERE e.id = ${id}
    `;
		return era ?? null;
	}
}
