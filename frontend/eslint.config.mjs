// @ts-check
import prettier from "eslint-config-prettier";

import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
	// Prettier owns formatting; strip any ESLint stylistic rules that would
	// conflict with it (mirrors the root eslint.config.js pattern).
	prettier
);
