import type postgres from "postgres";

import { type Era } from "@/types/eras.schema.js";

import { BaseRepository } from "../../basic/BaseRepository.js";
import { ErrorMessage } from "../../basic/ErrorMessage.js";

export class EraRepository extends BaseRepository<Era> {
	constructor(db: postgres.Sql) {
		super(db, "eras");
	}

	override async findAll(): Promise<Era[]> {
		return this.db<Era[]>`
      SELECT e.id, p.name AS actor, e.start_year, e.end_year
      FROM eras e
      JOIN people p ON p.id = e.actor_id
      ORDER BY e.id
    `;
	}

	override async findById(id: number): Promise<Era | ErrorMessage> {
		const [era] = await this.db<Era[]>`
      SELECT e.id, p.name AS actor, e.start_year, e.end_year
      FROM eras e
      JOIN people p ON p.id = e.actor_id
      WHERE e.id = ${id}
    `;
		if (era !== undefined) {
			return era;
		}
		return new ErrorMessage(`No era found with id='${id}'`, 404);
	}
}
