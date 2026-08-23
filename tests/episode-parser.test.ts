import { describe, expect, it } from "vitest";

import {
	buildEpisodeRows,
	extractAirDate,
	extractEpisodeCount,
	extractPartNumber,
	extractTitle,
	NON_MERGING_STORY_GROUPS,
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

	it("returns null when no Part marker", () => {
		expect(extractPartNumber("''[[Rose (TV story)|Rose]]''")).toBeNull();
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

	it("returns null when no date present", () => {
		expect(extractAirDate("no date here")).toBeNull();
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

	it("assigns null seasonName to specials not in a Series section", () => {
		const s = stories.find((s) => s.title === "Doctor Who");
		expect(s).toMatchObject({ eraId: 8, seasonName: null });
	});

	it("has no duplicate wiki numbers", () => {
		const nums = stories.map((s) => s.wikiNumber);
		expect(nums).toHaveLength(new Set(nums).size);
	});

	it("parses over 300 stories", () => {
		expect(stories.length).toBeGreaterThan(300);
	});

	it("classic stories have episodeCount > 1 (An Unearthly Child has 4, The Daleks has 7)", () => {
		const daleks = stories.find((s) => s.title === "The Daleks");
		expect(daleks?.episodeCount).toBe(7);
	});

	it("total episodes across all classic stories is plausible (>600)", () => {
		const classicEpisodes = stories
			.filter((s) => s.eraId <= 8)
			.reduce((sum, s) => sum + s.episodeCount, 0);
		expect(classicEpisodes).toBeGreaterThan(600);
	});

	it("modern stories each have episodeCount of 1, except recognized multi-part stories", () => {
		const modernMultiEp = stories.filter(
			(s) => s.eraId >= 9 && s.episodeCount > 1
		);
		expect(modernMultiEp.every((s) => s.parts && s.parts.length > 1)).toBe(
			true
		);
	});

	it("merges lettered two-part story 311a/311b into a single story with per-part titles", () => {
		const merged = stories.find((s) => s.wikiNumber === "311");
		expect(merged).toMatchObject({
			title: "The Legend of Ruby Sunday",
			episodeCount: 2,
			parts: [
				{ title: "The Legend of Ruby Sunday", airDate: "2024-06-15" },
				{ title: "Empire of Death", airDate: "2024-06-22" },
			],
		});

		expect(stories.find((s) => s.wikiNumber === "311a")).toBeUndefined();
		expect(stories.find((s) => s.wikiNumber === "311b")).toBeUndefined();
	});

	it("merges lettered six-part story 297a-f (Flux) into one story with per-part titles", () => {
		const merged = stories.find((s) => s.wikiNumber === "297");
		expect(merged?.episodeCount).toBe(6);
		expect(merged?.parts).toHaveLength(6);

		for (const letter of ["a", "b", "c", "d", "e", "f"]) {
			expect(
				stories.find((s) => s.wikiNumber === `297${letter}`)
			).toBeUndefined();
		}
	});

	it("does not merge The Trial of a Time Lord (143a-143d) — denylisted as four separate stories", () => {
		expect(stories.find((s) => s.wikiNumber === "143")).toBeUndefined();

		const parts = ["143a", "143b", "143c", "143d"];
		const expectedEpisodeCounts = [4, 4, 4, 2];
		parts.forEach((wikiNumber, i) => {
			const s = stories.find((s) => s.wikiNumber === wikiNumber);
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
			const m = story.wikiNumber.match(/^(\d+)([a-z])$/);
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
			wikiNumber: "162",
			title: "Rose",
			eraId: 9,
			seasonName: "Series 1",
			episodeCount: 1,
			airDate: "2005-03-26",
			partNumber: null,
			isClassic: false,
		};
		expect(buildEpisodeRows(rose)).toEqual([
			{ title: "Rose", airDate: "2005-03-26", partNumber: null },
		]);
	});

	it("synthesizes numbered parts sharing the story title for a classic multi-part story", () => {
		const unearthlyChild: ParsedStory = {
			wikiNumber: "1",
			title: "An Unearthly Child",
			eraId: 1,
			seasonName: "Season 1",
			episodeCount: 4,
			airDate: "1963-11-23",
			partNumber: null,
			isClassic: true,
		};
		expect(buildEpisodeRows(unearthlyChild)).toEqual([
			{ title: "An Unearthly Child", airDate: "1963-11-23", partNumber: 1 },
			{ title: "An Unearthly Child", airDate: null, partNumber: 2 },
			{ title: "An Unearthly Child", airDate: null, partNumber: 3 },
			{ title: "An Unearthly Child", airDate: null, partNumber: 4 },
		]);
	});

	it("uses each part's own title and air date for a merged lettered two-part story", () => {
		const legendOfRubySunday: ParsedStory = {
			wikiNumber: "311",
			title: "The Legend of Ruby Sunday",
			eraId: 15,
			seasonName: "Series 14",
			episodeCount: 2,
			airDate: "2024-06-15",
			partNumber: null,
			isClassic: false,
			parts: [
				{ title: "The Legend of Ruby Sunday", airDate: "2024-06-15" },
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
