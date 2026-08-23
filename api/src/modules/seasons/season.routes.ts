import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
	Season,
	SeasonIdParam,
	SeasonQuerystring,
} from "@/types/seasons.schema.js";

import { ErrorMessage } from "../../basic/BasicSchemas.js";
import { Paginated, resolvePagination } from "../../basic/Pagination.js";
import { SeasonRepository } from "./season.repository.js";
import { SeasonService } from "./season.service.js";

const seasonsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
	const service = new SeasonService(new SeasonRepository(fastify.db));

	fastify.get(
		"/seasons",
		{
			schema: {
				tags: ["seasons"],
				description: "List all seasons, optionally filtered by Doctor era",
				querystring: SeasonQuerystring,
				response: { 200: Paginated(Season) },
			},
		},
		async (request) => {
			const { pageNum, perPage, era_id } = request.query;
			return service.getAll(resolvePagination({ pageNum, perPage }), era_id);
		}
	);

	fastify.get(
		"/seasons/:id",
		{
			schema: {
				tags: ["seasons"],
				description: "Get a single season by ID",
				params: SeasonIdParam,
				response: {
					200: Season,
					404: ErrorMessage,
				},
			},
		},
		async (request, reply) => {
			const season = await service.getById(request.params.id);
			if (!season) return reply.code(404).send({ error: "Season not found" });
			return season;
		}
	);
};

export default seasonsRoutes;
