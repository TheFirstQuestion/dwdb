import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Fastify from "fastify";

import episodesRoutes from "./modules/episodes/episode.routes.js";
import erasRoutes from "./modules/eras/era.routes.js";
import seasonsRoutes from "./modules/seasons/season.routes.js";
import corsPlugin from "./plugins/cors.js";
import dbPlugin from "./plugins/db.js";
import swaggerPlugin from "./plugins/swagger.js";

const fastify = Fastify({
	logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

await fastify.register(corsPlugin);
await fastify.register(dbPlugin);
await fastify.register(swaggerPlugin);
await fastify.register(erasRoutes);
await fastify.register(seasonsRoutes);
await fastify.register(episodesRoutes);

fastify.get("/health", async () => ({ status: "ok" }));

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
await fastify.listen({ port, host: "0.0.0.0" });
