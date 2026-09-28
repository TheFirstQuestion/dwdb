import { ordinalWordToNumber } from "@/utils/numbers.js";

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

	const num = numMatch[1];
	if (!num) return null;
	return { number: parseInt(num), name };
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
		const linkedYear = linked[1];
		const bareYear = bare[1];
		if (!linkedYear || !bareYear) return null;
		return linked.index < bare.index
			? parseInt(linkedYear)
			: parseInt(bareYear);
	}
	if (linked) {
		const year = linked[1];
		return year !== undefined ? parseInt(year) : null;
	}
	if (bare) {
		const year = bare[1];
		return year !== undefined ? parseInt(year) : null;
	}
	return null;
}

export function parseSeasons(wikitext: string): SeasonData[] {
	const seasons: SeasonData[] = [];
	const seen = new Set<string>(); // deduplicate by display name
	const eraSections = wikitext.split(/(?=^== .+ Doctor.* ==)/m);

	for (const eraSection of eraSections) {
		const eraMatch = eraSection.match(/^== (\w+) Doctor.* ==/m);
		if (!eraMatch) continue;
		const eraName = eraMatch[1];
		if (!eraName) continue;
		const eraId = ordinalWordToNumber(eraName);
		if (!eraId) continue;

		// Only split on Season/Series subsections; specials/other headings stay
		// as part of the preceding chunk and are naturally skipped
		const seasonSections = eraSection.split(
			/(?=^===\s*\[\[(?:Season|Series))/m
		);

		for (const seasonSection of seasonSections) {
			const headingMatch = seasonSection.match(
				/^===\s*(\[\[[^\]]+\]\])\s*===/m
			);
			if (!headingMatch) continue;

			const heading = headingMatch[1];
			if (!heading) continue;
			const parsed = parseSeasonHeading(heading);
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
