import simpleImportSort from "eslint-plugin-simple-import-sort";

// Shared rule set used by both the root ESLint config (api/, types/, etc.)
// and frontend/eslint.config.mjs, so the two packages don't drift apart.
/** @type {import("eslint").Linter.Config} */
export const sharedConfig = {
	plugins: {
		"simple-import-sort": simpleImportSort,
	},
	rules: {
		"@typescript-eslint/no-non-null-assertion": "error",
		"@typescript-eslint/no-explicit-any": "error",
		"@typescript-eslint/no-unused-vars": "warn",
		"simple-import-sort/imports": "warn",
		"simple-import-sort/exports": "warn",
		"no-console": "warn",
		"no-debugger": "error",
		"prefer-const": "error",
		"no-var": "error",
		eqeqeq: ["error", "always", { null: "ignore" }],
		curly: "error",
	},
};
