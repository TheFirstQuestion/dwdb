import { BaseService } from "../../basic/BaseService.js";
import {
	paginationOffset,
	toPaginatedResult,
	type PaginationParams,
} from "../../basic/Pagination.js";
import type { EpisodeRepository } from "./episode.repository.js";

export class EpisodeService extends BaseService<EpisodeRepository> {
	async getAll(
		pagination: PaginationParams,
		eraId?: number,
		seasonId?: number
	) {
		const { rows, total } = await this.repo.findAllPaginated({
			eraId,
			seasonId,
			limit: pagination.perPage,
			offset: paginationOffset(pagination),
		});
		return toPaginatedResult(rows, total, pagination);
	}

	async getById(id: number) {
		return this.repo.findById(id);
	}
}
