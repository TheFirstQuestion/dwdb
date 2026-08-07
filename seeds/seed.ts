import { spawnSync } from "child_process";
import { readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));

const scripts = readdirSync(dir)
	.filter((f) => /^seed-\d/.test(f) && f.endsWith(".ts"))
	.sort();

for (const script of scripts) {
	console.log(`\n▶ ${script}`);
	const result = spawnSync("tsx", [join(dir, script)], {
		stdio: "inherit",
		env: process.env,
	});
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}
