import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import {
	Episode,
	EpisodeIdParam,
	EpisodeQuerystring,
} from "./episode.schema.js";
import { ErrorMessage } from "../../basic/BasicSchemas.js";
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
				description: "List all episodes, optionally filtered by era or season",
				querystring: EpisodeQuerystring,
				response: { 200: Paginated(Episode) },
			},
		},
		async (request) => {
			const { pageNum, perPage, era_id, season_id } = request.query;
			return service.getAll(
				resolvePagination({ pageNum, perPage }),
				era_id,
				season_id
			);
		}
	);

	fastify.get(
		"/episodes/:id",
		{
			schema: {
				tags: ["episodes"],
				description: "Get a single episode by ID",
				params: EpisodeIdParam,
				response: {
					200: Episode,
					404: ErrorMessage,
				},
			},
		},
		async (request, reply) => {
			const episode = await service.getById(request.params.id);
			if (!episode) return reply.code(404).send({ error: "Episode not found" });
			return episode;
		}
	);
};

export default episodesRoutes;
