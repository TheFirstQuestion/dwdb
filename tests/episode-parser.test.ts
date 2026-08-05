import { describe, it, expect } from "vitest";
import {
	extractTitle,
	extractPartNumber,
	extractEpisodeCount,
	extractAirDate,
	parseStories,
} from "../seeds/episode-parser.js";
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

	it("modern stories each have episodeCount of 1", () => {
		const modernMultiEp = stories.filter(
			(s) => s.eraId >= 9 && s.episodeCount > 1
		);
		expect(modernMultiEp).toHaveLength(0);
	});
});
