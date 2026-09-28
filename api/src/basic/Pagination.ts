import { type TSchema, Type } from "@sinclair/typebox";

import {
	DEFAULT_PAGE_NUM,
	DEFAULT_PER_PAGE,
	pageNumSchema,
	type PaginationQuery,
	perPageSchema,
} from "@/types/util/pagination.schema.js";

export interface PaginationParams {
	pageNum: number;
	perPage: number;
}

// Resolved values used by services/repositories once defaults are applied.
export function resolvePagination(query: PaginationQuery): PaginationParams {
	return {
		pageNum: query.pageNum ?? DEFAULT_PAGE_NUM,
		perPage: query.perPage ?? DEFAULT_PER_PAGE,
	};
}

export function Paginated<T extends TSchema>(item: T) {
	return Type.Object({
		data: Type.Array(item),
		total: Type.Integer({ minimum: 0 }),
		pageNum: pageNumSchema,
		perPage: perPageSchema,
		totalPages: Type.Integer({ minimum: 0 }),
	});
}

export interface PaginatedResult<T> extends PaginationParams {
	data: T[];
	total: number;
	totalPages: number;
}

// Raw repository-layer result: a page of rows plus the total matching count.
export interface RowsWithTotal<T> {
	rows: T[];
	total: number;
}

// Resolved limit/offset passed down to a repository query.
export interface PaginationOffset {
	limit: number;
	offset: number;
}

export function paginationOffset(pagination: PaginationParams): number {
	return (pagination.pageNum - 1) * pagination.perPage;
}

export function toPaginatedResult<T>(
	data: T[],
	total: number,
	pagination: PaginationParams
): PaginatedResult<T> {
	return {
		...pagination,
		data,
		total,
		totalPages: Math.ceil(total / pagination.perPage),
	};
}
