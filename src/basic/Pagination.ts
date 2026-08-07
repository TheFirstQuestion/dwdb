import { type Static, type TSchema, Type } from "@sinclair/typebox";

const DEFAULT_PAGE_NUM = 1;
const DEFAULT_PER_PAGE = 25;

const pageNumSchema = Type.Integer({
	minimum: 1,
	default: DEFAULT_PAGE_NUM,
	description: "Page number (1-indexed)",
});
const perPageSchema = Type.Integer({
	minimum: 1,
	maximum: 100,
	default: DEFAULT_PER_PAGE,
	description: "Items per page",
});

// Request-side: caller may omit either field and get the default.
export const paginationQuery = Type.Object({
	pageNum: Type.Optional(pageNumSchema),
	perPage: Type.Optional(perPageSchema),
});

export type PaginationQuery = Static<typeof paginationQuery>;

// Resolved values used by services/repositories once defaults are applied.
export interface PaginationParams {
	pageNum: number;
	perPage: number;
}

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
