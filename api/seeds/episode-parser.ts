import { ordinalWordToNumber } from "@/utils/numbers.js";

import { parseSeasonHeading } from "./season-parser.js";

export interface ParsedStoryPart {
	title: string;
	airDate?: string;
	pageTitle?: string;
}

export interface ParsedStory {
	// Absent for number-less rows (the list page shows `-` in the number cell): minisodes, animated serials, charity pieces, etc. Only the ones on NUMBER_LESS_STORY_ALLOWLIST are emitted.
	storyNumber?: string;
	title: string;
	eraId: number;
	seasonName?: string;
	episodeCount: number;
	airDate?: string;
	partNumber?: number;
	// The wiki page the title cell links to: the link *target* (not the display text) with any `#section` anchor dropped, e.g. "Rose (TV story)" or "Shada (webcast)". Absent when the title cell has no link.
	pageTitle?: string;
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

/**
 * Removes the parts of a title cell that can contain stray links or text (part labels, templates, refs, small-print notes) before title/link extraction.
 *
 * @param cell - Raw wikitext of a title table cell.
 * @returns The cell with part labels, `{{templates}}`, `<ref>` tags, `<small>` notes, and `<nowiki/>` escapes removed.
 */
function stripTitleCellNoise(cell: string): string {
	cell = cell.replace(/<small>\s*\(Part\s+\d+\)\s*<\/small>/gi, "");
	cell = cell.replace(/\{\{[^}]+\}\}/g, "");
	cell = cell
		.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
		.replace(/<ref[^>]*\/>/g, "");
	// `<nowiki/>` is an empty escape the wiki puts before a leading apostrophe (e.g. "'Twas the Night Before Christmas") so it isn't read as italics markup.
	return cell
		.replace(/<small>[^<]*<\/small>/gi, "")
		.replace(/<nowiki\s*\/>/gi, "");
}

export function extractPageTitle(cell: string): string | undefined {
	const link = stripTitleCellNoise(cell).match(
		/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/
	);
	const target = link?.[1]?.split("#")[0]?.trim();
	return target ? target : undefined;
}

export function extractTitle(cell: string): string {
	cell = stripTitleCellNoise(cell);
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

export function extractPartNumber(cell: string): number | undefined {
	const m = cell.match(/<small>\s*\(Part\s+(\d+)\)\s*<\/small>/i);
	if (!m) return undefined;
	const matched = m[1];
	return matched !== undefined ? parseInt(matched) : undefined;
}

export function extractEpisodeCount(cell: string): number {
	const m = cell.match(/^(\d+)/);
	if (!m) return 1;
	const matched = m[1];
	return matched !== undefined ? parseInt(matched) : 1;
}

// The third cell of a number-less row is a running time ("3 minutes", "1 minute, 20 seconds", "4 minutes each") for a minisode but an episode count ("6", "13") for an animated serial. A running time counts as one episode; splitting multi-part titles like "Pond Life (5 Parts)" is out of scope.
export function extractNumberLessEpisodeCount(cell: string): number {
	if (/\b(?:sec(?:ond)?|min(?:ute)?|hour)s?\b/i.test(cell)) return 1;
	return extractEpisodeCount(cell);
}

export function extractAirDate(cell: string): string | undefined {
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
		if (d === undefined || m === undefined) return undefined;
		day = parseInt(d);
		monthName = m;
	} else if (bareDayMonth) {
		const d = bareDayMonth[1];
		const m = bareDayMonth[2];
		if (d === undefined || m === undefined) return undefined;
		day = parseInt(d);
		monthName = m;
	} else {
		return undefined;
	}

	const month = MONTH_MAP[monthName.toLowerCase()];
	if (!month) return undefined;

	const linkedYear = cell.match(
		/\[\[(\d{4})\s*\((?:releases|production)\)\|[^\]]+\]\]/
	);
	const bareYear = cell.match(/\b(19\d{2}|20\d{2})\b/);

	let year: number | undefined;
	if (linkedYear) {
		const y = linkedYear[1];
		year = y !== undefined ? parseInt(y) : undefined;
	} else if (bareYear) {
		const y = bareYear[1];
		year = y !== undefined ? parseInt(y) : undefined;
	}

	if (!year) return undefined;

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

// The page link targets of the number-less list rows (minisodes, animated serials, Comic Relief and Children in Need pieces, and so on) that are canonical enough to seed. Not every minisode is canonical, so number-less rows are opt-in: this is editorial, human-curated data that cannot be derived from the wiki formatting, like NON_MERGING_STORY_GROUPS. Keyed by the row's page link target (e.g. "Born Again (TV story)") rather than display text, which is stable. Anything not listed stays out of the database. To add one, append its link target here; `tests/episode-parser.test.ts` fails if an entry no longer matches a row on the list page.
export const NUMBER_LESS_STORY_ALLOWLIST: ReadonlySet<string> = new Set<string>(
	[
		// Tenth Doctor
		"Born Again (TV story)",
		"Tardisode 1",
		"Tardisode 2",
		"Tardisode 3",
		"Tardisode 4",
		"Tardisode 5",
		"Tardisode 6",
		"Tardisode 7",
		"Tardisode 8",
		"Tardisode 9",
		"Tardisode 10",
		"Tardisode 11",
		"Tardisode 12",
		"Tardisode 13",
		"Time Crash (TV story)",
		"Music of the Spheres (TV story)",
		"A Ghost Story for Christmas (webcast)",
		"The Infinite Quest (TV story)",
		"Dreamland (TV story)",
		// Eleventh Doctor
		"Meanwhile in the TARDIS (home video)",
		"Analysis Lessons (webcast)",
		"Dermot and the Doctor (TV story)",
		"Space (TV story)",
		"Time (TV story)",
		"Prequel (The Impossible Astronaut)",
		"Prequel (The Curse of the Black Spot)",
		"Prequel (A Good Man Goes to War)",
		"Prequel (Let's Kill Hitler)",
		"Prequel (The Wedding of River Song)",
		"Death Is the Only Answer (TV story)",
		"Night and the Doctor",
		"Prequel (The Doctor, the Widow and the Wardrobe)",
		"Good as Gold (TV story)",
		"Pond Life (TV story)",
		"Asylum of the Daleks Prequel (webcast)",
		"The Making of the Gunslinger (webcast)",
		"P.S. (webcast)",
		"The Great Detective (TV story)",
		"Vastra Investigates: A Christmas Prequel (webcast)",
		"The Bells of Saint John: A Prequel (webcast)",
		"The Battle of Demons Run: Two Days Later (webcast)",
		"She Said, He Said: A Prequel (webcast)",
		"Clarence and the Whispermen (home video)",
		"Rain Gods (home video)",
		"The Inforarium (home video)",
		"Clara and the TARDIS (home video)",
		"A Night with the Stars (TV story)",
		"The History of the Doctor (TV story)",
		"The Last Day",
		// Twelfth Doctor
		"Prequel to Deep Breath (theatrical film)",
		"The Doctor Who Experience (webcast)",
		"Prologue (webcast)",
		"The Doctor's Meditation (TV story)",
		// Thirteenth Doctor
		"The Universe is Calling (TV story)",
		"'Twas the Night Before Christmas (webcast)",
		"Message from the Doctor (webcast)",
		"United we stand, 2m apart (webcast)",
		"The Shadow in the Mirror (webcast)",
		"A New Year's message from the Doctor... (webcast)",
		"Welcome to the TARDIS... (TV story)",
		"A Message from Yaz (webcast)",
		"A Message from the Doctor (webcast)",
		"The Flux is Coming... (TV story)",
		// Fourteenth Doctor
		"Destination: Skaro (TV story)",
		"Doctor Who: The Bedtime Story (TV story)",
		// Fifteenth Doctor
		"The Doctor takes Match of the Day on a trip through time?!! (webcast)",
		"Bad Music (TV story)",
		"The TARDIS is landing just in time for Christmas! (webcast)",
	]
);

// A number-less row shows only a dash ("-", an en/em dash, or a dash plus a <br/>-separated second dash) in the number cell.
function isNumberLessCell(cell: string): boolean {
	return /^[-–—]+$/.test(cell.replace(/<br\s*\/?>/gi, "").replace(/\s+/g, ""));
}

// `"all"` is for tooling and tests that need every number-less row regardless of curation.
type NumberLessFilter = ReadonlySet<string> | "all";

function parseRow(
	cells: string[],
	eraId: number,
	seasonName: string | undefined,
	numberLessFilter: NumberLessFilter
): ParsedStory | undefined {
	if (cells.length < 4) return undefined;

	const c1 = cells[0];
	const c2 = cells[1];
	const c3 = cells[2];
	const c4 = cells[3];

	if (!c1 || !c2 || !c3 || !c4) return undefined;

	const storyNumber = c1.trim();

	if (isNumberLessCell(storyNumber)) {
		const pageTitle = extractPageTitle(c2);
		if (!pageTitle) return undefined;
		if (numberLessFilter !== "all" && !numberLessFilter.has(pageTitle)) {
			return undefined;
		}
		const title = extractTitle(c2);
		if (!title) return undefined;
		return {
			title,
			eraId,
			// Number-less rows have no season heading.
			seasonName: undefined,
			episodeCount: extractNumberLessEpisodeCount(c3),
			airDate: extractAirDate(c4),
			partNumber: extractPartNumber(c2),
			pageTitle,
			isClassic: true,
		};
	}

	if (!storyNumber || !/^\d/.test(storyNumber)) return undefined;

	const isClassic = /^(?:''|\[\[)/.test(c2);

	let title: string;
	let episodeCount: number;
	let airDate: string | undefined;
	let partNumber: number | undefined;
	let pageTitle: string | undefined;

	if (isClassic) {
		title = extractTitle(c2);
		pageTitle = extractPageTitle(c2);
		partNumber = extractPartNumber(c2);
		episodeCount = extractEpisodeCount(c3);
		airDate = extractAirDate(c4);
	} else {
		title = extractTitle(c3);
		pageTitle = extractPageTitle(c3);
		partNumber = extractPartNumber(c3);
		episodeCount = 1;
		airDate = extractAirDate(c4);
	}

	if (!title) return undefined;
	return {
		storyNumber,
		title,
		eraId,
		seasonName,
		episodeCount,
		airDate,
		partNumber,
		pageTitle,
		isClassic,
	};
}

export function parseRawStories(
	wikitext: string,
	numberLessFilter: NumberLessFilter = NUMBER_LESS_STORY_ALLOWLIST
): ParsedStory[] {
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
			let seasonName: string | undefined;
			const headingMatch = sub.match(/^={3,}\s*(\[\[[^\]]+\]\])\s*={3,}/m);
			if (headingMatch && headingMatch[1]) {
				const parsed = parseSeasonHeading(headingMatch[1]);
				seasonName = parsed?.name;
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
				let carryCell: string | undefined;
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
								carryCell = cells[1];
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

					const story = parseRow(cells, eraId, seasonName, numberLessFilter);
					if (!story) continue;
					// Number-less stories are identified by (title, eraId).
					const key =
						story.storyNumber ?? `number-less:${eraId}:${story.title}`;
					if (seen.has(key)) continue;
					seen.add(key);
					stories.push(story);
				}
			}
		}
	}

	return stories;
}

export function parseStories(
	wikitext: string,
	numberLessFilter: NumberLessFilter = NUMBER_LESS_STORY_ALLOWLIST
): ParsedStory[] {
	return mergeLetteredParts(parseRawStories(wikitext, numberLessFilter));
}

export interface EpisodeRow {
	title: string;
	airDate?: string;
	partNumber?: number;
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
			airDate: i === 0 ? story.airDate : undefined,
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
	let bufferBase: string | undefined;

	const flush = () => {
		if (buffer.length === 0) return;
		const shouldNotMerge =
			buffer.length === 1 ||
			(bufferBase !== undefined && NON_MERGING_STORY_GROUPS.has(bufferBase));
		if (shouldNotMerge) {
			merged.push(...buffer);
		} else if (bufferBase) {
			const first = buffer[0];
			if (first) {
				merged.push({
					...first,
					storyNumber: bufferBase,
					episodeCount: buffer.length,
					partNumber: undefined,
					parts: buffer.map((s) => ({
						title: s.title,
						airDate: s.airDate,
						pageTitle: s.pageTitle,
					})),
				});
			}
		}
		buffer = [];
		bufferBase = undefined;
	};

	for (const story of stories) {
		// An absent number (number-less story) flushes the buffer and passes through untouched.
		const m = story.storyNumber?.match(/^(\d+)([a-z])$/);
		if (!m || !m[1]) {
			flush();
			merged.push(story);
			continue;
		}
		const base = m[1];
		if (bufferBase !== undefined && base !== bufferBase) flush();
		bufferBase = base;
		buffer.push(story);
	}
	flush();

	return merged;
}
