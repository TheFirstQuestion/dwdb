import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Mirrors tsconfig.json's "paths" — Vite/Vitest don't read tsconfig path
// mappings on their own, so real (non-type-only) imports across the
// @/types and @/api aliases need this to resolve at test runtime.
export default defineConfig({
	resolve: {
		alias: {
			"@/types": fileURLToPath(new URL("./types", import.meta.url)),
			"@/api": fileURLToPath(new URL("./api/src", import.meta.url)),
		},
	},
});
