import fp from "fastify-plugin";
import postgres from "postgres";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
	interface FastifyInstance {
		db: postgres.Sql;
	}
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const sql = postgres(url);
	fastify.decorate("db", sql);
	fastify.addHook("onClose", async () => {
		await sql.end();
	});
};

export default fp(dbPlugin);
