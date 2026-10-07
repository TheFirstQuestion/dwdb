// @ts-check
import prettier from "eslint-config-prettier";

import { sharedConfig } from "../eslint.shared.js";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
	// Same rule set the root eslint.config.js uses, so api/ and frontend/
	// don't drift apart.
	sharedConfig,
	// Prettier owns formatting; strip any ESLint stylistic rules that would
	// conflict with it (mirrors the root eslint.config.js pattern).
	prettier
);
