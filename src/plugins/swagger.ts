import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
	await fastify.register(swagger, {
		openapi: {
			info: {
				title: "dwdb API",
				description: "Doctor Who episode database",
				version: "0.1.0",
			},
			tags: [
				{ name: "eras", description: "Doctor incarnations / eras" },
				{ name: "seasons", description: "Classic and modern seasons / series" },
			],
		},
	});

	await fastify.register(swaggerUi, {
		routePrefix: "/docs",
	});
};

export default fp(swaggerPlugin);
