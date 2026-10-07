import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
	episode,
	type EpisodeFilter,
	episodeIdParam,
	EpisodeQuerystring,
} from "@/types/episodes.schema.js";

import { ErrorMessage, errorResponses } from "../../basic/ErrorMessage.js";
import { Paginated, resolvePagination } from "../../basic/Pagination.js";
import { EpisodeRepository } from "./episode.repository.js";
import { EpisodeService } from "./episode.service.js";

const episodesRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
	const service = new EpisodeService(new EpisodeRepository(fastify.db));

	fastify.get(
		"/episodes",
		{
			schema: {
				tags: ["episodes"],
				summary: "List all episodes, optionally filtered by era or season",
				querystring: EpisodeQuerystring,
				response: { 200: Paginated(episode) },
			},
		},
		async (request) => {
			const { pageNum, perPage, era_id, season_id } = request.query;

			const filters: EpisodeFilter[] = [];
			if (era_id !== undefined) {
				filters.push({ column: "era_id", value: era_id });
			}
			if (season_id !== undefined) {
				filters.push({ column: "season_id", value: season_id });
			}

			return service.getAll(resolvePagination({ pageNum, perPage }), filters);
		}
	);

	fastify.get(
		"/episodes/:id",
		{
			schema: {
				tags: ["episodes"],
				summary: "Get a single episode by ID",
				params: episodeIdParam,
				response: {
					200: episode,
					...errorResponses,
				},
			},
		},
		async (request, reply) => {
			const result = await service.getById(request.params.id);
			if (result instanceof ErrorMessage) {
				return reply.code(result.code).send(result);
			}
			return result;
		}
	);
};

export default episodesRoutes;
