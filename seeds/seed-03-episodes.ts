import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { buildEpisodeRows, parseStories } from "./episode-parser.js";

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

	const stories = parseStories(wikitext);

	console.log(`Parsed ${stories.length} stories.`);

	const sql = postgres(url);

	try {
		const seasonRows = await sql<{ id: number; name: string }[]>`
      SELECT id, name FROM seasons
    `;
		const seasonByName = new Map(seasonRows.map((r) => [r.name, r.id]));

		await sql.begin(async (tx) => {
			let storyCount = 0;
			let episodeCount = 0;

			for (const story of stories) {
				const seasonId = story.seasonName
					? (seasonByName.get(story.seasonName) ?? null)
					: null;

				const [storyRow] = await tx<{ id: number }[]>`
          INSERT INTO stories (title, era_id, season_id, wiki_number)
          VALUES (${story.title}, ${story.eraId}, ${seasonId}, ${story.wikiNumber})
          ON CONFLICT (wiki_number) DO UPDATE
            SET title      = EXCLUDED.title,
                era_id     = EXCLUDED.era_id,
                season_id  = EXCLUDED.season_id
          RETURNING id
        `;
				const storyId = storyRow.id;
				storyCount++;

				await tx`DELETE FROM episodes WHERE story_id = ${storyId}`;

				for (const row of buildEpisodeRows(story)) {
					await tx`
            INSERT INTO episodes (story_id, era_id, season_id, title, air_date, part_number)
            VALUES (
              ${storyId}, ${story.eraId}, ${seasonId}, ${row.title},
              ${row.airDate}, ${row.partNumber}
            )
          `;
					episodeCount++;
				}
			}

			console.log(
				`\nDone. ${storyCount} stories and ${episodeCount} episodes upserted.`
			);
		});
	} finally {
		await sql.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
