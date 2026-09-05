import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ["@nuxt/eslint", "@nuxt/ui"],

	// Formatting is owned by Prettier (see package.json "format" script); disable
	// @nuxt/eslint's built-in stylistic rules so ESLint and Prettier don't fight
	// over the same concerns.
	eslint: {
		config: {
			stylistic: false,
		},
	},

	css: ["~/assets/css/main.css"],

	// Resolves the same shared TypeBox schemas the API uses (root tsconfig.json's
	// "@/types/*" -> "types/*"), so frontend code can `import { Era } from
	// "@/types/eras.schema.js"` without duplicating types. Nuxt 4 generates its own
	// project tsconfig.json as a set of TS project references with no
	// compilerOptions of its own (see frontend/tsconfig.json), so there's no single
	// file to add a `paths` entry to directly — the `alias` option here is Nuxt's
	// supported mechanism for this, and it feeds both the bundler's module
	// resolution and the generated `.nuxt/tsconfig.*.json` `paths` entries.
	//
	// "@/api" is also needed even though frontend code never imports from it
	// directly: types/seasons.schema.ts and types/episodes.schema.ts import
	// `paginationQuery` from "@/api/basic/Pagination.js" (root tsconfig.json's
	// "@/api/*" -> "api/src/*"), so `nuxt typecheck` needs to resolve that path
	// to type-check anything that transitively imports those schema files (e.g.
	// `import type { SeasonRow }`). This has no runtime effect on the frontend
	// bundle — `import type` is erased, so Pagination.ts is never actually
	// bundled client-side.
	alias: {
		"@/types": fileURLToPath(new URL("../types", import.meta.url)),
		"@/api": fileURLToPath(new URL("../api/src", import.meta.url)),
	},

	// Nuxt's dev server defaults to port 3000, which collides with the API's
	// own default port (see api/src/index.ts / .env's PORT). Pin the frontend
	// dev server to 3001 so both can run simultaneously without either side
	// needing a manual port override. Kept in sync with the CORS allow-list
	// in api/src/plugins/cors.ts.
	devServer: { port: 3001 },

	// Public runtime config is the supported way to expose env-driven values to
	// client-side code in Nuxt — raw `process.env` reads aren't available in the
	// browser bundle. Override via the NUXT_PUBLIC_API_URL env var; defaults to
	// the API's own local dev default (see api/src/index.ts's PORT fallback).
	runtimeConfig: {
		public: {
			apiUrl: "http://localhost:3000",
		},
	},

	devtools: { enabled: true },
	compatibilityDate: "2025-07-15",

	// Locked decision (see temp/frontend-migration-plan.md's Key Decisions
	// table): this is a client-side-only SPA, not server-rendered — it always
	// fetches from the API at runtime rather than being pre-rendered. This
	// also avoids a Nuxt composable-context pitfall: useRuntimeConfig() is
	// called after an await inside episodes/[id].vue's useAsyncData handler,
	// which needs SSR's async-context restoration to be safe; ssr: false
	// removes SSR from the picture entirely.
	ssr: false,
});
