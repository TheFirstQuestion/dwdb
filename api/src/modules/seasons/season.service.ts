import { BaseService } from "../../basic/BaseService.js";
import {
	paginationOffset,
	type PaginationParams,
	toPaginatedResult,
} from "../../basic/Pagination.js";
import type { SeasonRepository } from "./season.repository.js";

export class SeasonService extends BaseService<SeasonRepository> {
	async getAll(pagination: PaginationParams, eraId?: number) {
		const { rows, total } = await this.repo.findAllPaginated({
			eraId,
			limit: pagination.perPage,
			offset: paginationOffset(pagination),
		});
		return toPaginatedResult(rows, total, pagination);
	}

	async getById(id: number) {
		return this.repo.findById(id);
	}
}
