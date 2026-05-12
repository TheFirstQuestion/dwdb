import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { parseEras } from "./era-parser.js";

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

	const eras = parseEras(wikitext);

	console.log("Parsed eras:");
	for (const era of eras) {
		console.log(
			`  ${era.id}. ${era.actor} (${era.start_year}–${era.end_year ?? "present"})`
		);
	}

	const sql = postgres(url);

	try {
		await sql.begin(async (tx) => {
			for (const era of eras) {
				const [person] = await tx`
          INSERT INTO people (name) VALUES (${era.actor})
          ON CONFLICT DO NOTHING
          RETURNING id
        `;

				const personId =
					person?.id ??
					(await tx`SELECT id FROM people WHERE name = ${era.actor}`)[0].id;

				await tx`
          INSERT INTO eras (id, actor_id, start_year, end_year)
          VALUES (${era.id}, ${personId}, ${era.start_year}, ${era.end_year})
          ON CONFLICT (id) DO UPDATE
            SET actor_id = EXCLUDED.actor_id,
                start_year = EXCLUDED.start_year,
                end_year = EXCLUDED.end_year
        `;

				console.log(`  Inserted era ${era.id}: ${era.actor}`);
			}
		});

		console.log("\nDone.");
	} finally {
		await sql.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
