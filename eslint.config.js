import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

import { sharedConfig } from "./eslint.shared.js";

export default tseslint.config(
	{ ignores: ["dist/", "node_modules/"] },
	tseslint.configs.recommended,
	sharedConfig,
	prettier
);
