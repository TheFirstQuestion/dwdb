import { describe, it, expect } from "vitest";
import {
	paginationOffset,
	resolvePagination,
	toPaginatedResult,
} from "../src/basic/Pagination.js";

describe("resolvePagination", () => {
	it("defaults pageNum to 1 and perPage to 25 when omitted", () => {
		expect(resolvePagination({})).toEqual({ pageNum: 1, perPage: 25 });
	});

	it("passes through explicit values", () => {
		expect(resolvePagination({ pageNum: 3, perPage: 10 })).toEqual({
			pageNum: 3,
			perPage: 10,
		});
	});
});

describe("paginationOffset", () => {
	it("returns 0 for the first page", () => {
		expect(paginationOffset({ pageNum: 1, perPage: 25 })).toBe(0);
	});

	it("returns perPage * (pageNum - 1) for later pages", () => {
		expect(paginationOffset({ pageNum: 3, perPage: 20 })).toBe(40);
	});
});

describe("toPaginatedResult", () => {
	it("rounds totalPages up on a partial last page", () => {
		const result = toPaginatedResult([1, 2, 3], 22, {
			pageNum: 1,
			perPage: 10,
		});
		expect(result.totalPages).toBe(3);
	});

	it("matches exactly on an even multiple", () => {
		const result = toPaginatedResult([1, 2, 3], 20, {
			pageNum: 1,
			perPage: 10,
		});
		expect(result.totalPages).toBe(2);
	});

	it("is 0 when total is 0", () => {
		const result = toPaginatedResult([], 0, { pageNum: 1, perPage: 10 });
		expect(result.totalPages).toBe(0);
	});

	it("carries data, total, pageNum, and perPage through unchanged", () => {
		const result = toPaginatedResult(["a", "b"], 2, {
			pageNum: 1,
			perPage: 10,
		});
		expect(result).toEqual({
			data: ["a", "b"],
			total: 2,
			pageNum: 1,
			perPage: 10,
			totalPages: 1,
		});
	});
});
