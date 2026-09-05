import type { EpisodeRow } from "@/types/episodes.schema.js";
import type { EraRow } from "@/types/eras.schema.js";
import type { SeasonRow } from "@/types/seasons.schema.js";

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

interface ApiErrorBody {
	error: string;
}

interface PaginationParams {
	pageNum?: number;
	perPage?: number;
}

function buildQuery(params: Record<string, number | undefined>): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) search.set(key, String(value));
	}
	const query = search.toString();
	return query ? `?${query}` : "";
}

async function request<T>(path: string): Promise<T> {
	const config = useRuntimeConfig();
	const response = await fetch(`${config.public.apiUrl}${path}`);

	if (!response.ok) {
		const body = (await response
			.json()
			.catch(() => null)) as ApiErrorBody | null;
		throw new Error(
			body?.error ?? `Request to ${path} failed with status ${response.status}`
		);
	}

	return (await response.json()) as T;
}

// GET /eras and GET /eras/:id, /seasons, and /episodes are the API's only
// exposed routes today (api/src/index.ts). Seasons and episodes are filtered
// via querystring params (era_id/season_id), not nested resource paths — see
// api/src/modules/*/*.routes.ts.
export const apiClient = {
	getEras: () => request<EraRow[]>("/eras"),

	getEra: (id: number) => request<EraRow>(`/eras/${id}`),

	getSeasons: (filters: { eraId?: number } & PaginationParams = {}) =>
		request<Paginated<SeasonRow>>(
			`/seasons${buildQuery({
				era_id: filters.eraId,
				pageNum: filters.pageNum,
				perPage: filters.perPage,
			})}`
		),

	getSeason: (id: number) => request<SeasonRow>(`/seasons/${id}`),

	getEpisodes: (
		filters: { eraId?: number; seasonId?: number } & PaginationParams = {}
	) =>
		request<Paginated<EpisodeRow>>(
			`/episodes${buildQuery({
				era_id: filters.eraId,
				season_id: filters.seasonId,
				pageNum: filters.pageNum,
				perPage: filters.perPage,
			})}`
		),

	getEpisode: (id: number) => request<EpisodeRow>(`/episodes/${id}`),
};
