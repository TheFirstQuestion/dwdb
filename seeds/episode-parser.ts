import { ordinalWordToNumber } from "./constants.js";
import { parseSeasonHeading } from "./season-parser.js";

export interface ParsedStory {
	wikiNumber: string;
	title: string;
	eraId: number;
	seasonName: string | null;
	episodeCount: number;
	airDate: string | null;
	partNumber: number | null;
}

const MONTH_MAP: Record<string, number> = {
	january: 1,
	february: 2,
	march: 3,
	april: 4,
	may: 5,
	june: 6,
	july: 7,
	august: 8,
	september: 9,
	october: 10,
	november: 11,
	december: 12,
};

export function extractTitle(cell: string): string {
	cell = cell.replace(/<small>\s*\(Part\s+\d+\)\s*<\/small>/gi, "");
	cell = cell.replace(/\{\{[^}]+\}\}/g, "");
	cell = cell
		.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
		.replace(/<ref[^>]*\/>/g, "");
	cell = cell.replace(/<small>[^<]*<\/small>/gi, "");
	const withPipe = cell.match(/\[\[[^\]]*\|([^\]]+)\]\]/);
	if (withPipe) {
		cell = withPipe[1];
	} else {
		const bare = cell.match(/\[\[([^\]]*)\]\]/);
		if (bare) cell = bare[1];
	}
	return cell.replace(/''/g, "").trim();
}

export function extractPartNumber(cell: string): number | null {
	const m = cell.match(/<small>\s*\(Part\s+(\d+)\)\s*<\/small>/i);
	return m ? parseInt(m[1]) : null;
}

export function extractEpisodeCount(cell: string): number {
	const m = cell.match(/^(\d+)/);
	return m ? parseInt(m[1]) : 1;
}

export function extractAirDate(cell: string): string | null {
	const linkedDayMonth = cell.match(
		/\[\[(\d{1,2})\s+([A-Za-z]+)\s+\(releases\)\|[^\]]+\]\]/
	);
	const bareDayMonth = cell.match(
		/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/i
	);

	let day: number, monthName: string;
	if (linkedDayMonth) {
		day = parseInt(linkedDayMonth[1]);
		monthName = linkedDayMonth[2];
	} else if (bareDayMonth) {
		day = parseInt(bareDayMonth[1]);
		monthName = bareDayMonth[2];
	} else {
		return null;
	}

	const month = MONTH_MAP[monthName.toLowerCase()];
	if (!month) return null;

	const linkedYear = cell.match(
		/\[\[(\d{4})\s*\((?:releases|production)\)\|[^\]]+\]\]/
	);
	const bareYear = cell.match(/\b(19\d{2}|20\d{2})\b/);
	const year = linkedYear
		? parseInt(linkedYear[1])
		: bareYear
			? parseInt(bareYear[1])
			: null;
	if (!year) return null;

	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function cellContent(line: string): string {
	if (line.startsWith("!")) {
		return line.replace(/^!(?:[^|]*\|)?/, "").trim();
	}
	return line.slice(1).trim();
}

function parseRow(
	cells: string[],
	eraId: number,
	seasonName: string | null
): ParsedStory | null {
	if (cells.length < 4) return null;
	const [c1, c2, c3, c4] = cells;

	const wikiNumber = c1.trim();
	if (!wikiNumber || !/^\d/.test(wikiNumber)) return null;

	const isClassic = /^(?:''|\[\[)/.test(c2);

	let title: string;
	let episodeCount: number;
	let airDate: string | null;
	let partNumber: number | null;

	if (isClassic) {
		title = extractTitle(c2);
		partNumber = extractPartNumber(c2);
		episodeCount = extractEpisodeCount(c3);
		airDate = extractAirDate(c4);
	} else {
		title = extractTitle(c3);
		partNumber = extractPartNumber(c3);
		episodeCount = 1;
		airDate = extractAirDate(c4);
	}

	if (!title) return null;
	return {
		wikiNumber,
		title,
		eraId,
		seasonName,
		episodeCount,
		airDate,
		partNumber,
	};
}

export function parseStories(wikitext: string): ParsedStory[] {
	const stories: ParsedStory[] = [];
	const seen = new Set<string>();

	const eraSections = wikitext.split(/(?=^== .+ Doctor.* ==)/m);

	for (const eraSection of eraSections) {
		const eraMatch = eraSection.match(/^== (\w+) Doctor.* ==/m);
		if (!eraMatch) continue;
		const eraId = ordinalWordToNumber(eraMatch[1]);
		if (!eraId) continue;

		const subsections = eraSection.split(/(?=^={3,}\s*\[)/m);

		for (const sub of subsections) {
			let seasonName: string | null = null;
			const headingMatch = sub.match(/^={3,}\s*(\[\[[^\]]+\]\])\s*={3,}/m);
			if (headingMatch) {
				const parsed = parseSeasonHeading(headingMatch[1]);
				seasonName = parsed ? parsed.name : null;
			}

			const tablePat = /\{\|[\s\S]+?^\|\}/gm;
			let tableMatch: RegExpExecArray | null;
			while ((tableMatch = tablePat.exec(sub)) !== null) {
				const rowBlocks = tableMatch[0].split(/^(?=\|-)/m);
				for (const block of rowBlocks) {
					const lines = block
						.split("\n")
						.filter((l) => /^[!|](?![-}|])/.test(l));
					if (lines.length < 4) continue;

					const cells = lines.slice(0, 4).map(cellContent);
					const story = parseRow(cells, eraId, seasonName);
					if (!story) continue;
					if (seen.has(story.wikiNumber)) continue;
					seen.add(story.wikiNumber);
					stories.push(story);
				}
			}
		}
	}

	return stories;
}
