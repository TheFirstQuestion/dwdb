import { BaseService } from "../../basic/BaseService.js";
import type { SeasonRepository } from "./season.repository.js";

export class SeasonService extends BaseService<SeasonRepository> {
	async getAll(eraId?: number) {
		return this.repo.findAll(eraId);
	}

	async getById(id: number) {
		return this.repo.findById(id);
	}
}
