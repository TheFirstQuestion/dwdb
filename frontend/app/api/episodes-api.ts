import type {
	Episode,
	EpisodeQuerystringParams,
} from "@/types/episodes.schema.js";
import { type Paginated, request } from "~/utils/api-request";

export const getEpisodes = (filters: EpisodeQuerystringParams) =>
	request<Paginated<Episode>>("/episodes", { query: filters });

export const getEpisode = (id: number) => request<Episode>(`/episodes/${id}`);
