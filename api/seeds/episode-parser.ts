import { ordinalWordToNumber } from "@/utils/numbers.js";

import { parseSeasonHeading } from "./season-parser.js";

export interface ParsedStoryPart {
	title: string;
	airDate: string | null;
}

export interface ParsedStory {
	wikiNumber: string;
	title: string;
	eraId: number;
	seasonName: string | null;
	episodeCount: number;
	airDate: string | null;
	partNumber: number | null;
	parts?: ParsedStoryPart[];
	// True when this row was parsed via the "classic" branch of parseRow —
	// i.e. its own title cell carried the title (not just a part label) and
	// its own episode-count cell is meaningful on its own. This is the
	// structural signal the drift-guard test in tests/episode-parser.test.ts
	// uses to flag lettered groups that might be story-arc segments rather
	// than story parts.
	isClassic: boolean;
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
		const matched = withPipe[1];
		if (matched !== undefined) {
			cell = matched;
		}
	} else {
		const bare = cell.match(/\[\[([^\]]*)\]\]/);
		if (bare) {
			const matched = bare[1];
			if (matched !== undefined) cell = matched;
		}
	}
	return cell.replace(/''/g, "").trim();
}

export function extractPartNumber(cell: string): number | null {
	const m = cell.match(/<small>\s*\(Part\s+(\d+)\)\s*<\/small>/i);
	if (!m) return null;
	const matched = m[1];
	return matched !== undefined ? parseInt(matched) : null;
}

export function extractEpisodeCount(cell: string): number {
	const m = cell.match(/^(\d+)/);
	if (!m) return 1;
	const matched = m[1];
	return matched !== undefined ? parseInt(matched) : 1;
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
		const d = linkedDayMonth[1];
		const m = linkedDayMonth[2];
		if (d === undefined || m === undefined) return null;
		day = parseInt(d);
		monthName = m;
	} else if (bareDayMonth) {
		const d = bareDayMonth[1];
		const m = bareDayMonth[2];
		if (d === undefined || m === undefined) return null;
		day = parseInt(d);
		monthName = m;
	} else {
		return null;
	}

	const month = MONTH_MAP[monthName.toLowerCase()];
	if (!month) return null;

	const linkedYear = cell.match(
		/\[\[(\d{4})\s*\((?:releases|production)\)\|[^\]]+\]\]/
	);
	const bareYear = cell.match(/\b(19\d{2}|20\d{2})\b/);

	let year: number | null = null;
	if (linkedYear) {
		const y = linkedYear[1];
		year = y !== undefined ? parseInt(y) : null;
	} else if (bareYear) {
		const y = bareYear[1];
		year = y !== undefined ? parseInt(y) : null;
	}

	if (!year) return null;

	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function cellContent(line: string): string {
	if (line.startsWith("!")) {
		return line.replace(/^!(?:[^|]*\|)?/, "").trim();
	}
	return line
		.slice(1)
		.replace(/^(?:rowspan|colspan)="\d+"\|/, "")
		.trim();
}

function parseRow(
	cells: string[],
	eraId: number,
	seasonName: string | null
): ParsedStory | null {
	if (cells.length < 4) return null;

	const c1 = cells[0];
	const c2 = cells[1];
	const c3 = cells[2];
	const c4 = cells[3];

	if (!c1 || !c2 || !c3 || !c4) return null;

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
		isClassic,
	};
}

export function parseRawStories(wikitext: string): ParsedStory[] {
	const stories: ParsedStory[] = [];
	const seen = new Set<string>();

	const eraSections = wikitext.split(/(?=^== .+ Doctor.* ==)/m);

	for (const eraSection of eraSections) {
		const eraMatch = eraSection.match(/^== (\w+) Doctor.* ==/m);
		if (!eraMatch || !eraMatch[1]) continue;
		const eraId = ordinalWordToNumber(eraMatch[1]);
		if (!eraId) continue;

		const subsections = eraSection.split(/(?=^={3,}\s*\[)/m);

		for (const sub of subsections) {
			let seasonName: string | null = null;
			const headingMatch = sub.match(/^={3,}\s*(\[\[[^\]]+\]\])\s*={3,}/m);
			if (headingMatch && headingMatch[1]) {
				const parsed = parseSeasonHeading(headingMatch[1]);
				seasonName = parsed ? parsed.name : null;
			}

			const tablePat = /\{\|[\s\S]+?^\|\}/gm;
			let tableMatch: RegExpExecArray | null;
			while ((tableMatch = tablePat.exec(sub)) !== null) {
				const rowBlocks = tableMatch[0].split(/^(?=\|-)/m);

				// Some wikitable rows share one column's value across several
				// consecutive rows via `rowspan="N"|value` on the first row only
				// (e.g. Flux's 297a-f share a single "1-6" episode-number cell) —
				// the later rows in the span omit that column's line entirely, so
				// they parse one cell short. Carry the declaring row's cell value
				// forward for the rest of the span instead of dropping those rows.
				let carryCell: string | null = null;
				let carryRemaining = 0;

				for (const block of rowBlocks) {
					const lines = block
						.split("\n")
						.filter((l) => /^[!|](?![-}|])/.test(l));

					let cells: string[];
					if (lines.length >= 4) {
						cells = lines.slice(0, 4).map(cellContent);
						const line1 = lines[1];
						if (line1) {
							const rowspanMatch = line1.match(/rowspan="(\d+)"/);
							if (rowspanMatch) {
								carryCell = cells[1] ?? null;
								const spanCount = rowspanMatch[1];
								carryRemaining =
									spanCount !== undefined ? parseInt(spanCount) - 1 : 0;
							}
						}
					} else if (lines.length === 3 && carryRemaining > 0) {
						const line0 = lines[0];
						const line1 = lines[1];
						const line2 = lines[2];
						if (!line0 || !line1 || !line2 || !carryCell) continue;
						cells = [
							cellContent(line0),
							carryCell,
							cellContent(line1),
							cellContent(line2),
						];
						carryRemaining--;
					} else {
						continue;
					}

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

export function parseStories(wikitext: string): ParsedStory[] {
	return mergeLetteredParts(parseRawStories(wikitext));
}

export interface EpisodeRow {
	title: string;
	airDate: string | null;
	partNumber: number | null;
}

export function buildEpisodeRows(story: ParsedStory): EpisodeRow[] {
	if (story.parts) {
		return story.parts.map((part, i) => ({
			title: part.title,
			airDate: part.airDate,
			partNumber: i + 1,
		}));
	}

	if (story.episodeCount > 1) {
		return Array.from({ length: story.episodeCount }, (_, i) => ({
			title: story.title,
			airDate: i === 0 ? story.airDate : null,
			partNumber: i + 1,
		}));
	}

	return [
		{
			title: story.title,
			airDate: story.airDate,
			partNumber: story.partNumber,
		},
	];
}

// Story parts vs. story arc segments look identical in the wiki's lettering
// convention (NNNa, NNNb, ...) — nothing in the letter suffix itself
// distinguishes "one story, several parts" from "several stories in an
// arc." Every group merges by default *except* the ones listed here, which
// are known, by domain knowledge (not derivable from wiki formatting), to be
// separate stories rather than parts of one story.
//
// "143" = The Trial of a Time Lord: four separate stories (The Mysterious
// Planet, Mindwarp, Terror of the Vervoids, The Ultimate Foe), linked by the
// "Trial of a Time Lord" story arc — not one four-part story.
//
// Add a new base number here (with a comment explaining why, same as
// above) whenever a newly-discovered lettered group turns out to be
// separate stories rather than one story's parts.
export const NON_MERGING_STORY_GROUPS: ReadonlySet<string> = new Set(["143"]);

function mergeLetteredParts(stories: ParsedStory[]): ParsedStory[] {
	const merged: ParsedStory[] = [];
	let buffer: ParsedStory[] = [];
	let bufferBase: string | null = null;

	const flush = () => {
		if (buffer.length === 0) return;
		const shouldNotMerge =
			buffer.length === 1 ||
			(bufferBase !== null && NON_MERGING_STORY_GROUPS.has(bufferBase));
		if (shouldNotMerge) {
			merged.push(...buffer);
		} else if (bufferBase) {
			const first = buffer[0];
			if (first) {
				merged.push({
					...first,
					wikiNumber: bufferBase,
					episodeCount: buffer.length,
					partNumber: null,
					parts: buffer.map((s) => ({ title: s.title, airDate: s.airDate })),
				});
			}
		}
		buffer = [];
		bufferBase = null;
	};

	for (const story of stories) {
		const m = story.wikiNumber.match(/^(\d+)([a-z])$/);
		if (!m || !m[1]) {
			flush();
			merged.push(story);
			continue;
		}
		const base = m[1];
		if (bufferBase !== null && base !== bufferBase) flush();
		bufferBase = base;
		buffer.push(story);
	}
	flush();

	return merged;
}
