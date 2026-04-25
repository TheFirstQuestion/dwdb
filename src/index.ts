import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import dbPlugin from "./plugins/db.js";
import swaggerPlugin from "./plugins/swagger.js";
import erasRoutes from "./modules/eras/era.routes.js";

const fastify = Fastify({
	logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

await fastify.register(dbPlugin);
await fastify.register(swaggerPlugin);
await fastify.register(erasRoutes);

fastify.get("/health", async () => ({ status: "ok" }));

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
await fastify.listen({ port, host: "0.0.0.0" });
