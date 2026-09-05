import { type Static, Type } from "@sinclair/typebox";

export const DEFAULT_PAGE_NUM = 1;
export const DEFAULT_PER_PAGE = 25;

export const pageNumSchema = Type.Integer({
	minimum: 1,
	default: DEFAULT_PAGE_NUM,
	description: "Page number (1-indexed)",
});
export const perPageSchema = Type.Integer({
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
