import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import postgres from "postgres";

declare module "fastify" {
	interface FastifyInstance {
		db: postgres.Sql;
	}
}

// Response schemas model nullable DB columns as *optional* (absent when unset), not nullable — but postgres.js returns SQL NULL as JS `null`, and Fastify's response serializer coerces a `null` against a non-nullable field type into a bogus zero-value (0, "") instead of omitting the key. Converting null -> undefined here, once, at the client level, means every repository query gets this for free.
export function nullToUndefined(value: unknown): unknown {
	return value === null ? undefined : value;
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const sql = postgres(url, {
		transform: { value: { from: nullToUndefined } },
	});
	fastify.decorate("db", sql);
	fastify.addHook("onClose", async () => {
		await sql.end();
	});
};

export default fp(dbPlugin);
