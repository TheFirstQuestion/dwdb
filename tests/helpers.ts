import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const WIKI_PAGE = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"wiki-data",
	"pages",
	"List_of_Doctor_Who_television_stories.json"
);

export function loadWikitext(): string {
	const raw = JSON.parse(readFileSync(WIKI_PAGE, "utf-8"));
	const page = Object.values(
		raw.query.pages as Record<
			string,
			{ revisions: Array<{ slots: { main: { "*": string } } }> }
		>
	)[0];
	return page.revisions[0].slots.main["*"];
}
