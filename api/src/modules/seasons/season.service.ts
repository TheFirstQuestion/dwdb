import { type SeasonFilter } from "@/types/seasons.schema.js";

import { BaseService } from "../../basic/BaseService.js";
import {
	paginationOffset,
	type PaginationParams,
	toPaginatedResult,
} from "../../basic/Pagination.js";
import type { SeasonRepository } from "./season.repository.js";

export class SeasonService extends BaseService<SeasonRepository> {
	async getAll(pagination: PaginationParams, filters: SeasonFilter[]) {
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
