import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { parseSeasons } from "./season-parser.js";

const WIKI_PAGE = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"wiki-data",
	"pages",
	"List_of_Doctor_Who_television_stories.json"
);

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const raw = JSON.parse(await readFile(WIKI_PAGE, "utf-8"));
	const wikitext = Object.values(
		raw.query.pages as Record<string, unknown>
	).map((p: unknown) => {
		const page = p as {
			revisions: Array<{ slots: { main: { "*": string } } }>;
		};
		return page.revisions[0].slots.main["*"];
	})[0];

	const seasons = parseSeasons(wikitext);

	console.log("Parsed seasons:");
	for (const s of seasons) {
		console.log(`  Era ${s.eraId} — ${s.name} (${s.year})`);
	}

	const sql = postgres(url);

	try {
		await sql.begin(async (tx) => {
			for (const s of seasons) {
				await tx`
          INSERT INTO seasons (era_id, number, name, year)
          VALUES (${s.eraId}, ${s.number}, ${s.name}, ${s.year})
          ON CONFLICT (era_id, number) DO UPDATE
            SET name = EXCLUDED.name,
                year = EXCLUDED.year
        `;
			}
		});

		console.log(`\nDone. ${seasons.length} seasons upserted.`);
	} finally {
		await sql.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
