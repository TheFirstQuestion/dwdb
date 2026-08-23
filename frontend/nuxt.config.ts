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
	alias: {
		"@/types": fileURLToPath(new URL("../types", import.meta.url)),
	},

	devtools: { enabled: true },
	compatibilityDate: "2025-07-15",
});
