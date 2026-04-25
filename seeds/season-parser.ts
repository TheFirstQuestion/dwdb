import { ordinalWordToNumber } from "./constants.js";

export interface SeasonData {
	eraId: number;
	number: number;
	name: string;
	year: number;
}

export function parseSeasonHeading(
	wikilink: string
): { number: number; name: string } | null {
	const inner = wikilink.slice(2, -2);
	const pipeIdx = inner.indexOf("|");
	const rawName = pipeIdx >= 0 ? inner.slice(pipeIdx + 1) : inner;
	const name = rawName.replace(/''([^']+)''/g, "$1").trim();

	const numMatch = name.match(/(?:Season|Series)\s+(\d+)/i);
	if (!numMatch) return null;

	return { number: parseInt(numMatch[1]), name };
}

export function extractFirstYear(text: string): number | null {
	// Search only within the episode table to avoid picking up years referenced
	// in intro prose (e.g. "the second time since [[2005]]...")
	const tableStart = text.indexOf("{|");
	const haystack = tableStart >= 0 ? text.slice(tableStart) : text;

	const LINKED = /\[\[(\d{4}) \((?:production|releases)\)\|\d{4}\]\]/g;
	const BARE = /\[\[[^\]]+\(releases\)[^\]]+\]\] (\d{4})/g;

	const linked = LINKED.exec(haystack);
	const bare = BARE.exec(haystack);

	if (linked && bare) {
		return linked.index < bare.index ? parseInt(linked[1]) : parseInt(bare[1]);
	}
	if (linked) return parseInt(linked[1]);
	if (bare) return parseInt(bare[1]);
	return null;
}

export function parseSeasons(wikitext: string): SeasonData[] {
	const seasons: SeasonData[] = [];
	const seen = new Set<string>(); // deduplicate by display name
	const eraSections = wikitext.split(/(?=^== .+ Doctor.* ==)/m);

	for (const eraSection of eraSections) {
		const eraMatch = eraSection.match(/^== (\w+) Doctor.* ==/m);
		if (!eraMatch) continue;
		const eraId = ordinalWordToNumber(eraMatch[1]);
		if (!eraId) continue;

		// Only split on Season/Series subsections; specials/other headings stay
		// as part of the preceding chunk and are naturally skipped
		const seasonSections = eraSection.split(/(?=^=== \[\[(?:Season|Series))/m);

		for (const seasonSection of seasonSections) {
			const headingMatch = seasonSection.match(/^=== (\[\[[^\]]+\]\]) ===/m);
			if (!headingMatch) continue;

			const parsed = parseSeasonHeading(headingMatch[1]);
			if (!parsed) continue;

			// Transitional seasons appear under two Doctors; keep the first (earlier) era
			if (seen.has(parsed.name)) continue;
			seen.add(parsed.name);

			const year = extractFirstYear(seasonSection);
			if (!year) {
				console.warn(`  No year found for ${parsed.name}`);
				continue;
			}

			seasons.push({ eraId, number: parsed.number, name: parsed.name, year });
		}
	}

	return seasons;
}
