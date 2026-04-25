import { Type } from "@sinclair/typebox";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Era, EraIdParam } from "./era.schema.js";
import { ErrorMessage } from "../../basic/BasicSchemas.js";
import { EraRepository } from "./era.repository.js";
import { EraService } from "./era.service.js";

const erasRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
	const service = new EraService(new EraRepository(fastify.db));

	fastify.get(
		"/eras",
		{
			schema: {
				description: "List all Doctor eras",
				response: { 200: Type.Array(Era) },
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
				description: "Get a single era by Doctor number",
				params: EraIdParam,
				response: {
					200: Era,
					404: ErrorMessage,
				},
			},
		},
		async (request, reply) => {
			const era = await service.getById(request.params.id);
			if (!era) return reply.code(404).send({ error: "Era not found" });
			return era;
		}
	);
};

export default erasRoutes;
