import type {
	Season,
	SeasonQuerystringParams,
} from "@/types/seasons.schema.js";

import { type Paginated, request } from "../utils/api-request";

export const getSeasons = (filters: SeasonQuerystringParams) =>
	request<Paginated<Season>>("/seasons", { query: filters });

export const getSeason = (id: number) => request<Season>(`/seasons/${id}`);
