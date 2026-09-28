import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { era, eraIdParam, eraList } from "@/types/eras.schema.js";

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
				description: "List all Doctor eras",
				response: { 200: eraList },
			},
		},
		async () => {
			return service.getAll();
		}
	);

	fastify.get(
		"/eras/:id",
		{
			schema: {
				tags: ["eras"],
				description: "Get a single era by Doctor number",
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
