import { describe, expect, it } from "vitest";

import {
	buildEpisodeRows,
	extractAirDate,
	extractEpisodeCount,
	extractNumberLessEpisodeCount,
	extractPageTitle,
	extractPartNumber,
	extractTitle,
	NON_MERGING_STORY_GROUPS,
	NUMBER_LESS_STORY_ALLOWLIST,
	type ParsedStory,
	parseRawStories,
	parseStories,
} from "../api/seeds/episode-parser.js";
import { loadWikitext } from "./helpers.js";

const wikitext = loadWikitext();

describe("extractTitle", () => {
	it("extracts display name from piped classic wikilink", () => {
		expect(
			extractTitle("''[[An Unearthly Child (TV story)|An Unearthly Child]]''")
		).toBe("An Unearthly Child");
	});

	it("handles reversed italic nesting (Series 15 style)", () => {
		expect(
			extractTitle(
				"[[The Robot Revolution (TV story)|''The Robot Revolution'']]"
			)
		).toBe("The Robot Revolution");
	});

	it("strips Christmas special template", () => {
		expect(
			extractTitle(
				"''[[Joy to the World (TV story)|Joy to the World]]'' {{sm|(Christmas special)}}"
			)
		).toBe("Joy to the World");
	});

	it("strips Part suffix from title", () => {
		expect(
			extractTitle(
				"''[[The Legend of Ruby Sunday (TV story)|The Legend of Ruby Sunday]]'' <small>(Part 1)</small>"
			)
		).toBe("The Legend of Ruby Sunday");
	});

	it("strips ref tags", () => {
		expect(
			extractTitle("''[[Shada (TV story)|Shada]]''<ref>Never broadcast</ref>")
		).toBe("Shada");
	});
});

describe("extractPartNumber", () => {
	it("extracts Part 1", () => {
		expect(
			extractPartNumber(
				"''[[The Legend of Ruby Sunday (TV story)|The Legend of Ruby Sunday]]'' <small>(Part 1)</small>"
			)
		).toBe(1);
	});

	it("extracts Part 2", () => {
		expect(
			extractPartNumber(
				"''[[Empire of Death (TV story)|Empire of Death]]'' <small>(Part 2)</small>"
			)
		).toBe(2);
	});

	it("returns undefined when no Part marker", () => {
		expect(extractPartNumber("''[[Rose (TV story)|Rose]]''")).toBeUndefined();
	});
});

describe("extractEpisodeCount", () => {
	it("parses plain integer", () => {
		expect(extractEpisodeCount("4")).toBe(4);
	});

	it("ignores ref footnote after the number", () => {
		expect(
			extractEpisodeCount(
				"3<ref>originally produced as four episodes, later edited to three</ref>"
			)
		).toBe(3);
	});

	it("returns 1 for a single episode", () => {
		expect(extractEpisodeCount("1")).toBe(1);
	});
});

describe("extractAirDate", () => {
	it("parses linked date with linked year", () => {
		expect(
			extractAirDate(
				"[[26 March (releases)|26 March]] [[2005 (releases)|2005]]"
			)
		).toBe("2005-03-26");
	});

	it("parses linked date with bare year (classic range)", () => {
		expect(
			extractAirDate(
				"[[23 November (releases)|23 November]]–[[14 December (releases)|14 December]] 1963"
			)
		).toBe("1963-11-23");
	});

	it("parses bare date (no wikilinks)", () => {
		expect(extractAirDate("11 May 2024")).toBe("2024-05-11");
	});

	it("parses linked date with bare year (mixed)", () => {
		expect(extractAirDate("[[19 April (releases)|19 April]] 2025")).toBe(
			"2025-04-19"
		);
	});

	it("returns undefined when no date present", () => {
		expect(extractAirDate("no date here")).toBeUndefined();
	});
});

describe("extractPageTitle", () => {
	it("returns the link target of a piped TV story link, not the display text", () => {
		expect(
			extractPageTitle(
				"''[[An Unearthly Child (TV story)|An Unearthly Child]]''"
			)
		).toBe("An Unearthly Child (TV story)");
	});

	it("uses the target when display text differs from it", () => {
		expect(extractPageTitle("''[[Untitled (1986 TV story)|Untitled]]''")).toBe(
			"Untitled (1986 TV story)"
		);
	});

	it("handles reversed italic nesting", () => {
		expect(
			extractPageTitle(
				"[[The Robot Revolution (TV story)|''The Robot Revolution'']]"
			)
		).toBe("The Robot Revolution (TV story)");
	});

	it("captures webcast-style targets", () => {
		expect(extractPageTitle("''[[Shada (webcast)|Shada]]''")).toBe(
			"Shada (webcast)"
		);
	});

	it("captures a bare (unpiped) link", () => {
		expect(extractPageTitle("''[[Tardisode 1]]''")).toBe("Tardisode 1");
	});

	it("drops a section anchor", () => {
		expect(
			extractPageTitle("''[[Some Story (TV story)#Plot|Some Story]]''")
		).toBe("Some Story (TV story)");
	});

	it("ignores links inside templates, refs, and small tags", () => {
		expect(
			extractPageTitle(
				"''[[Joy to the World (TV story)|Joy to the World]]'' {{sm|([[Christmas special]])}}<ref>[[Other]]</ref>"
			)
		).toBe("Joy to the World (TV story)");
	});

	it("returns undefined when the cell has no link", () => {
		expect(extractPageTitle("''Plain Title''")).toBeUndefined();
	});
});

describe("extractNumberLessEpisodeCount", () => {
	it.each([
		["3 minutes", 1],
		["1 minute, 20 seconds", 1],
		["4 minutes each", 1],
		["2.5 minutes", 1],
		["3x16 seconds", 1],
		["2 hours", 1],
		["1", 1],
		["13", 13],
		["6<br>(incomplete)", 6],
	])("%s -> %i", (cell, expected) => {
		expect(extractNumberLessEpisodeCount(cell)).toBe(expected);
	});
});

describe("number-less stories", () => {
	const header =
		'{|\n|-\n! scope="col" | Story\n! scope="col" | Title\n! scope="col" | Episodes\n! scope="col" | Original airdates\n';
	const bornAgain = `|-
! scope="row" |-
|''[[Born Again (TV story)|Born Again]]''
|7 minutes
|[[18 November (releases)|18 November]] [[2005 (releases)|2005]]
`;
	const tardisode = `|-
! scope="row" |-
|''[[Tardisode 1]]''
|42 seconds
|[[1 April (releases)|1 April]] [[2006 (releases)|2006]]
`;
	const smithAndJones = `|-
! scope="row" |179
|1
|''[[Smith and Jones (TV story)|Smith and Jones]]''
|[[31 March (releases)|31 March]] [[2007 (releases)|2007]]
`;
	const table = `== Tenth Doctor ==
=== Mini-episodes ===
${header}${bornAgain}${tardisode}${bornAgain}${smithAndJones}|}
`;
	const allowlist = new Set(["Born Again (TV story)"]);

	it("drops number-less rows when the allowlist is empty", () => {
		const stories = parseStories(table, new Set());
		expect(stories.map((s) => s.title)).toEqual(["Smith and Jones"]);
	});

	it("keeps only allowlisted number-less rows, de-duplicated by (title, eraId)", () => {
		const stories = parseStories(table, allowlist);
		expect(stories.map((s) => s.title)).toEqual([
			"Born Again",
			"Smith and Jones",
		]);
		expect(stories[0]?.storyNumber).toBeUndefined();
		expect(stories[0]?.seasonName).toBeUndefined();
		expect(stories[0]).toMatchObject({
			eraId: 10,
			episodeCount: 1,
			airDate: "2005-11-18",
			pageTitle: "Born Again (TV story)",
		});
	});

	it("records pageTitle on numbered rows", () => {
		const stories = parseStories(table, allowlist);
		expect(stories[1]?.pageTitle).toBe("Smith and Jones (TV story)");
	});

	it("records pageTitle on each part of a merged lettered story", () => {
		const lettered = `== Tenth Doctor ==
${header}|-
! scope="row" |100a
|1
|''[[Part A (TV story)|Part A]]''
|[[1 March (releases)|1 March]] [[2007 (releases)|2007]]
|-
! scope="row" |100b
|1
|''[[Part B (TV story)|Part B]]''
|[[2 March (releases)|2 March]] [[2007 (releases)|2007]]
|}
`;
		const [merged] = parseStories(lettered, new Set());
		expect(merged?.parts?.map((p) => p.pageTitle)).toEqual([
			"Part A (TV story)",
			"Part B (TV story)",
		]);
	});

	it("does not letter-merge across a number-less row", () => {
		const lettered = `== Tenth Doctor ==
${header}|-
! scope="row" |100a
|1
|''[[Part A (TV story)|Part A]]''
|[[1 March (releases)|1 March]] [[2007 (releases)|2007]]
${bornAgain}|-
! scope="row" |100b
|1
|''[[Part B (TV story)|Part B]]''
|[[2 March (releases)|2 March]] [[2007 (releases)|2007]]
|}
`;
		const stories = parseStories(lettered, allowlist);
		expect(stories.map((s) => s.storyNumber)).toEqual([
			"100a",
			undefined,
			"100b",
		]);
	});

	describe("against the real list page", () => {
		const everyNumberLessTarget = new Set(
			parseRawStories(wikitext, "all").flatMap((s) =>
				s.storyNumber === undefined && s.pageTitle ? [s.pageTitle] : []
			)
		);

		it("every allowlist entry matches a number-less row on the list page", () => {
			for (const entry of NUMBER_LESS_STORY_ALLOWLIST) {
				expect(everyNumberLessTarget.has(entry), entry).toBe(true);
			}
		});

		it("seeded number-less stories equal the allowlist", () => {
			const seeded = parseStories(wikitext).filter(
				(s) => s.storyNumber === undefined
			);
			expect(new Set(seeded.map((s) => s.pageTitle))).toEqual(
				new Set(NUMBER_LESS_STORY_ALLOWLIST)
			);
		});

		it("no two number-less stories share (title, eraId)", () => {
			const keys = parseStories(wikitext)
				.filter((s) => s.storyNumber === undefined)
				.map((s) => `${s.eraId}:${s.title}`);
			expect(keys).toHaveLength(new Set(keys).size);
		});
	});
});

describe("parseStories", () => {
	const stories = parseStories(wikitext);

	it("parses An Unearthly Child as First Doctor, Season 1, 4 episodes", () => {
		const s = stories.find((s) => s.title === "An Unearthly Child");
		expect(s).toMatchObject({
			eraId: 1,
			seasonName: "Season 1",
			episodeCount: 4,
			airDate: "1963-11-23",
		});
	});

	it("parses modern episode Rose as Ninth Doctor, Series 1, 1 episode", () => {
		const s = stories.find((s) => s.title === "Rose");
		expect(s).toMatchObject({
			eraId: 9,
			seasonName: "Series 1",
			episodeCount: 1,
			airDate: "2005-03-26",
		});
	});

	it("parses Series 15 story The Robot Revolution as Fifteenth Doctor", () => {
		const s = stories.find((s) => s.title === "The Robot Revolution");
		expect(s).toMatchObject({
			eraId: 15,
			seasonName: "Series 15",
			episodeCount: 1,
		});
	});

	it("leaves seasonName undefined for specials not in a Series section", () => {
		const s = stories.find((s) => s.title === "Doctor Who");
		expect(s).toMatchObject({ eraId: 8, seasonName: undefined });
	});

	it("has no duplicate story numbers", () => {
		const nums = stories
			.map((s) => s.storyNumber)
			.filter((n) => n !== undefined);
		expect(nums).toHaveLength(new Set(nums).size);
	});

	it("parses over 300 stories", () => {
		expect(stories.length).toBeGreaterThan(300);
	});

	it("classic stories have episodeCount > 1 (The Daleks has 7)", () => {
		const daleks = stories.find((s) => s.title === "The Daleks");
		expect(daleks?.episodeCount).toBe(7);
	});

	it("total episodes across all classic stories is plausible (>600)", () => {
		const classicEpisodes = stories
			.filter((s) => s.eraId <= 8)
			.reduce((sum, s) => sum + s.episodeCount, 0);
		expect(classicEpisodes).toBeGreaterThan(600);
	});

	// TODO: bad test
	it("modern stories each have episodeCount of 1, except recognized multi-part stories", () => {
		// Number-less animated serials (e.g. The Infinite Quest) have several episodes but no per-part rows; buildEpisodeRows synthesizes those.
		const modernMultiEp = stories.filter(
			(s) => s.eraId >= 9 && s.storyNumber !== undefined && s.episodeCount > 1
		);
		expect(modernMultiEp.every((s) => s.parts && s.parts.length > 1)).toBe(
			true
		);
	});

	it("merges lettered two-part story 311a/311b ('The Legend of Ruby Sunday'/'Empire of Death') into a single story with per-part titles", () => {
		const merged = stories.find((s) => s.storyNumber === "311");
		expect(merged).toMatchObject({
			title: "The Legend of Ruby Sunday",
			episodeCount: 2,
			parts: [
				{ title: "The Legend of Ruby Sunday", airDate: "2024-06-15" },
				{ title: "Empire of Death", airDate: "2024-06-22" },
			],
		});

		expect(stories.find((s) => s.storyNumber === "311a")).toBeUndefined();
		expect(stories.find((s) => s.storyNumber === "311b")).toBeUndefined();
	});

	it("merges lettered six-part story 297a-f (Flux) into one story with per-part titles", () => {
		const merged = stories.find((s) => s.storyNumber === "297");
		expect(merged?.episodeCount).toBe(6);
		expect(merged?.parts).toHaveLength(6);

		for (const letter of ["a", "b", "c", "d", "e", "f"]) {
			expect(
				stories.find((s) => s.storyNumber === `297${letter}`)
			).toBeUndefined();
		}
	});

	it("does not merge The Trial of a Time Lord (143a-143d) — denylisted as four separate stories", () => {
		expect(stories.find((s) => s.storyNumber === "143")).toBeUndefined();

		const parts = ["143a", "143b", "143c", "143d"];
		const expectedEpisodeCounts = [4, 4, 4, 2];
		parts.forEach((storyNumber, i) => {
			const s = stories.find((s) => s.storyNumber === storyNumber);
			expect(s).toMatchObject({
				episodeCount: expectedEpisodeCounts[i],
			});
			expect(s?.parts).toBeUndefined();
		});
	});

	it("flags every classic-style lettered group as a denylist entry (or fails, prompting a human decision)", () => {
		// Re-derive the raw, pre-merge rows for this assertion. parseStories()
		// only returns the post-merge result, so this test needs a way to see
		// the rows before mergeLetteredParts runs.
		const rawStories = parseRawStories(wikitext);

		const classicBaseNumbers = new Set<string>();
		for (const story of rawStories) {
			const m = story.storyNumber?.match(/^(\d+)([a-z])$/);
			if (m && story.isClassic) {
				const base = m[1];
				if (base) classicBaseNumbers.add(base);
			}
		}

		// Every base number flagged as classic-style must already be a
		// deliberate denylist entry. A base number showing up here that ISN'T
		// in NON_MERGING_STORY_GROUPS means a new Trial-of-a-Time-Lord-shaped
		// group appeared in the wiki data and nobody has classified it yet.
		for (const base of classicBaseNumbers) {
			expect(NON_MERGING_STORY_GROUPS.has(base)).toBe(true);
		}
	});
});

describe("buildEpisodeRows", () => {
	it("builds a single row for a single-episode modern story", () => {
		const rose: ParsedStory = {
			storyNumber: "162",
			title: "Rose",
			eraId: 9,
			seasonName: "Series 1",
			episodeCount: 1,
			airDate: "2005-03-26",
			isClassic: false,
		};
		expect(buildEpisodeRows(rose)).toEqual([
			{ title: "Rose", airDate: "2005-03-26" },
		]);
	});

	it("synthesizes numbered parts sharing the story title for a classic multi-part story", () => {
		const unearthlyChild: ParsedStory = {
			storyNumber: "1",
			title: "An Unearthly Child",
			eraId: 1,
			seasonName: "Season 1",
			episodeCount: 4,
			airDate: "1963-11-23",
			isClassic: true,
		};
		expect(buildEpisodeRows(unearthlyChild)).toEqual([
			{ title: "An Unearthly Child", airDate: "1963-11-23", partNumber: 1 },
			{ title: "An Unearthly Child", airDate: undefined, partNumber: 2 },
			{ title: "An Unearthly Child", airDate: undefined, partNumber: 3 },
			{ title: "An Unearthly Child", airDate: undefined, partNumber: 4 },
		]);
	});

	it("uses each part's own title and air date for a merged lettered two-part story", () => {
		const legendOfRubySunday: ParsedStory = {
			storyNumber: "311",
			title: "The Legend of Ruby Sunday",
			eraId: 15,
			seasonName: "Series 14",
			episodeCount: 2,
			airDate: "2024-06-15",
			isClassic: false,
			parts: [
				{
					title: "The Legend of Ruby Sunday",
					airDate: "2024-06-15",
				},
				{ title: "Empire of Death", airDate: "2024-06-22" },
			],
		};
		expect(buildEpisodeRows(legendOfRubySunday)).toEqual([
			{
				title: "The Legend of Ruby Sunday",
				airDate: "2024-06-15",
				partNumber: 1,
			},
			{ title: "Empire of Death", airDate: "2024-06-22", partNumber: 2 },
		]);
	});
});
