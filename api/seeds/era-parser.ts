import { type EraRow } from "@/types/eras.schema.js";

import { ordinalWordToNumber } from "./constants.js";

export function extractYears(text: string): number[] {
	const years: number[] = [];
	for (const m of text.matchAll(
		/\[\[(\d{4}) \((?:production|releases)\)\|\d{4}\]\]/g
	)) {
		const year = m[1];
		if (year !== undefined) {
			years.push(parseInt(year));
		}
	}
	return years;
}

export function extractActor(text: string): string | null {
	const m = text.match(/portrayed by \[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
	if (!m) return null;
	const actor = m[1];
	return actor !== undefined ? actor : null;
}

export function parseEras(wikitext: string): EraRow[] {
	const eras: EraRow[] = [];
	const sections = wikitext.split(/(?=^== .+ Doctor.* ==)/m);

	for (const section of sections) {
		const headingMatch = section.match(/^== (\w+) Doctor.* ==/m);
		if (!headingMatch) continue;

		const doctorName = headingMatch[1];
		if (!doctorName) continue;
		const doctorNumber = ordinalWordToNumber(doctorName);
		if (!doctorNumber) continue;

		let introLine: string | null = null;

		if (doctorNumber === 9) {
			// Canonical 9th Doctor (Eccleston) is inside the Series 1 subsection —
			// the top-level intro describes Rowan Atkinson in the non-canon Curse of Fatal Death
			const m = section.match(/=== \[\[Series 1.*?\]\] ===\n(.+)/);
			if (m) {
				const matched = m[1];
				introLine = matched !== undefined ? matched : null;
			}
		} else {
			const lines = section.split("\n").slice(1);
			introLine =
				lines.find((l) => l.trim().length > 0 && !l.startsWith("=")) ?? null;
		}

		if (!introLine) {
			console.warn(`  No intro line found for ${doctorName} Doctor`);
			continue;
		}

		const actor = extractActor(introLine);
		if (!actor) {
			console.warn(`  Could not extract actor for ${doctorName} Doctor`);
			continue;
		}

		const years = extractYears(introLine);
		if (years.length === 0) {
			console.warn(`  Could not extract years for ${doctorName} Doctor`);
			continue;
		}

		// "from [[YEAR" with no "to [[" means the era is still ongoing
		const isOngoing =
			/ from \[\[/.test(introLine) && !/ to \[\[/.test(introLine);

		const startYear = years[0];
		const endYear = years[years.length - 1];
		if (!startYear || !endYear) continue;

		eras.push({
			id: doctorNumber,
			actor,
			start_year: startYear,
			end_year: isOngoing ? null : endYear,
		});
	}

	return eras;
}
