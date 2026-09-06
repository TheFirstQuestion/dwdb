import type { ErrorMessage } from "@/api/basic/BasicSchemas.js";

// Mirrors the JSON shape returned by the API's `Paginated()` TypeBox envelope
// (api/src/basic/Pagination.ts) for every list endpoint. This is a plain
// client-side type describing that shape, not a duplicate of the TypeBox
// schema itself.
export interface Paginated<T> {
	data: T[];
	total: number;
	pageNum: number;
	perPage: number;
	totalPages: number;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly body: ErrorMessage | null
	) {
		super(message);
		this.name = "ApiError";
	}
}

// $fetch (ofetch) throws on non-2xx responses with the parsed JSON body
// already attached as `.data`; duck-typed rather than an `instanceof` check
// since `ofetch` isn't a direct dependency we can import the class from.
function isFetchError(
	error: unknown
): error is { status?: number; data?: unknown } {
	return typeof error === "object" && error !== null && "status" in error;
}

export async function request<T>(
	path: string,
	opts: { query?: Record<string, unknown> } = {}
): Promise<T> {
	try {
		return await $fetch<T>(path, {
			baseURL: useRuntimeConfig().public.apiUrl,
			query: opts.query,
		});
	} catch (error) {
		if (isFetchError(error)) {
			const status = error.status ?? 0;
			const body = (error.data ?? null) as ErrorMessage | null;
			throw new ApiError(
				body?.error ?? `Request to ${path} failed with status ${status}`,
				status,
				body
			);
		}
		throw error;
	}
}
