import type {
	SeasonQuerystringParams,
	Season,
} from "@/types/seasons.schema.js";

import { type Paginated, request } from "../utils/api-request";

export const getSeasons = (filters?: SeasonQuerystringParams) =>
	filters == null
		? undefined
		: request<Paginated<Season>>("/seasons", { query: filters });

export const getSeason = (id?: number) =>
	id == null ? undefined : request<Season>(`/seasons/${id}`);
