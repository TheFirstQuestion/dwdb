import cors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

// Local dev origins only for now. The Nuxt frontend (frontend/) defaults its
// dev server to port 3001 (see frontend/nuxt.config.ts) to avoid colliding
// with this API's own default port 3000. Allowing 3000 too covers anyone who
// overrides the frontend's dev port back to Nuxt's own default.
// TODO: once the frontend has a production deploy target (e.g. GitHub
// Pages), add its real origin here.
const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

const corsPlugin: FastifyPluginAsync = async (fastify) => {
	await fastify.register(cors, {
		origin: DEV_ORIGINS,
	});
};

export default fp(corsPlugin);
