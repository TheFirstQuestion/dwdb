import { type EpisodeFilter } from "@/types/episodes.schema.js";

import { BaseService } from "../../basic/BaseService.js";
import {
	paginationOffset,
	type PaginationParams,
	toPaginatedResult,
} from "../../basic/Pagination.js";
import type { EpisodeRepository } from "./episode.repository.js";

export class EpisodeService extends BaseService<EpisodeRepository> {
	async getAll(pagination: PaginationParams, filters: EpisodeFilter[]) {
		const { rows, total } = await this.repo.findAllWithFiltersPaginated(
			filters,
			{
				limit: pagination.perPage,
				offset: paginationOffset(pagination),
			}
		);
		return toPaginatedResult(rows, total, pagination);
	}

	async getById(id: number) {
		return this.repo.findById(id);
	}
}
