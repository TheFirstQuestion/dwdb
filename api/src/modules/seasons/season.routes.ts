import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
	season,
	type SeasonFilter,
	seasonIdParam,
	SeasonQuerystring,
} from "@/types/seasons.schema.js";

import { ErrorMessage, errorResponses } from "../../basic/ErrorMessage.js";
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
				summary: "List all seasons, optionally filtered by Doctor era",
				querystring: SeasonQuerystring,
				response: { 200: Paginated(season) },
			},
		},
		async (request) => {
			const { pageNum, perPage, era_id } = request.query;

			const filters: SeasonFilter[] = [];
			if (era_id != null) {
				filters.push({ column: "era_id", value: era_id });
			}

			return service.getAll(resolvePagination({ pageNum, perPage }), filters);
		}
	);

	fastify.get(
		"/seasons/:id",
		{
			schema: {
				tags: ["seasons"],
				summary: "Get a single season by ID",
				params: seasonIdParam,
				response: {
					200: season,
					...errorResponses,
				},
			},
		},
		async (request, reply) => {
			const result = await service.getById(request.params.id);
			if (result instanceof ErrorMessage)
				return reply.code(result.code).send(result);
			return result;
		}
	);
};

export default seasonsRoutes;
