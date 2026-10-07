import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
	era,
	eraIdParam,
	eraList,
	eraSearchQuery,
} from "@/types/eras.schema.js";

import { ErrorMessage, errorResponses } from "../../basic/ErrorMessage.js";
import { EraRepository } from "./era.repository.js";
import { EraService } from "./era.service.js";

const erasRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
	const service = new EraService(new EraRepository(fastify.db));

	fastify.get(
		"/eras",
		{
			schema: {
				tags: ["eras"],
				summary: "List all Doctor eras",
				response: { 200: eraList },
			},
		},
		async () => {
			return service.getAll();
		}
	);

	fastify.get(
		"/eras/search",
		{
			schema: {
				tags: ["eras"],
				summary: "Search eras by actor name",
				description:
					"Accepts 'First Last', 'First', or 'Last'. Returns every matching era (e.g. 'Tennant' matches both eras 10 and 14).",
				querystring: eraSearchQuery,
				response: { 200: eraList },
			},
		},
		async (request) => {
			return service.searchByActorName(request.query.name);
		}
	);

	fastify.get(
		"/eras/:id",
		{
			schema: {
				tags: ["eras"],
				summary: "Get a single era by Doctor number",
				params: eraIdParam,
				response: {
					200: era,
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

export default erasRoutes;
