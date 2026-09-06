import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

import { era, eraIdParam } from "@/types/eras.schema.js";

import { errorMessage } from "../../basic/BasicSchemas.js";
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
				response: { 200: Type.Array(era) },
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
					404: errorMessage,
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
