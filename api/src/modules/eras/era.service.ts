import { BaseService } from "../../basic/BaseService.js";
import type { EraRepository } from "./era.repository.js";

export class EraService extends BaseService<EraRepository> {
	async getAll() {
		return this.repo.findAll();
	}

	async searchByActorName(name: string) {
		return this.repo.findByActorName(name.trim());
	}

	async getById(id: number) {
		return this.repo.findById(id);
	}
}
