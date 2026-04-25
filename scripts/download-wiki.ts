import { writeFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const WIKI_API = "https://tardis.fandom.com/api.php";
const OUTPUT_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"wiki-data",
	"pages"
);
const BATCH_SIZE = 50;
const DELAY_MS = 500;
const MAX_PAGES = process.env.MAX_PAGES
	? parseInt(process.env.MAX_PAGES)
	: Infinity;

async function fetchJson(url: string): Promise<unknown> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
	return res.json();
}

async function getAllPageTitles(max: number): Promise<string[]> {
	const titles: string[] = [];
	let continueToken: string | undefined;

	do {
		const params = new URLSearchParams({
			action: "query",
			list: "allpages",
			aplimit: "500",
			format: "json",
			...(continueToken ? { apcontinue: continueToken } : {}),
		});

		const data = (await fetchJson(`${WIKI_API}?${params}`)) as Record<
			string,
			unknown
		>;
		const query = data.query as { allpages: Array<{ title: string }> };
		titles.push(...query.allpages.map((p) => p.title));

		const cont = data.continue as Record<string, string> | undefined;
		continueToken = cont?.apcontinue;

		console.log(`  fetched ${titles.length} titles...`);
	} while (continueToken && titles.length < max);

	return titles.slice(0, max);
}

async function fetchPageBatch(titles: string[]): Promise<unknown[]> {
	const params = new URLSearchParams({
		action: "query",
		titles: titles.join("|"),
		prop: "revisions",
		rvprop: "content",
		rvslots: "main",
		format: "json",
	});

	const data = (await fetchJson(`${WIKI_API}?${params}`)) as Record<
		string,
		unknown
	>;
	const query = data.query as { pages: Record<string, unknown> };
	return Object.values(query.pages);
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function safeName(title: string): string {
	return title.replace(/[/\\:*?"<>|]/g, "_");
}

function delay(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });

	console.log("Fetching page titles...");
	const capped = await getAllPageTitles(MAX_PAGES);
	console.log(`Processing: ${capped.length} pages\n`);

	let downloaded = 0;
	let skipped = 0;

	for (let i = 0; i < capped.length; i += BATCH_SIZE) {
		const batch = capped.slice(i, i + BATCH_SIZE);

		const toFetch: string[] = [];
		for (const title of batch) {
			const exists = await fileExists(
				join(OUTPUT_DIR, `${safeName(title)}.json`)
			);
			if (exists) {
				skipped++;
			} else {
				toFetch.push(title);
			}
		}

		if (toFetch.length > 0) {
			const pages = await fetchPageBatch(toFetch);
			for (const page of pages) {
				const p = page as { title: string };
				await writeFile(
					join(OUTPUT_DIR, `${safeName(p.title)}.json`),
					JSON.stringify(page, null, 2)
				);
				downloaded++;
			}
			await delay(DELAY_MS);
		}

		const done = i + batch.length;
		const total = capped.length;
		console.log(
			`${done}/${total} — ${downloaded} downloaded, ${skipped} skipped`
		);
	}

	console.log(`\nDone. ${downloaded} downloaded, ${skipped} skipped.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
