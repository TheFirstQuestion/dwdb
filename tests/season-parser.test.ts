import { describe, it, expect } from "vitest";
import {
	extractFirstYear,
	parseSeasonHeading,
	parseSeasons,
} from "../seeds/season-parser.js";
import { loadWikitext } from "./helpers.js";

const wikitext = loadWikitext();

describe("parseSeasonHeading", () => {
	it("parses a plain season link", () => {
		expect(parseSeasonHeading("[[Season 1]]")).toEqual({
			number: 1,
			name: "Season 1",
		});
	});

	it("uses display name from pipe alias", () => {
		expect(
			parseSeasonHeading("[[Season 16|Season 16 (''The Key to Time'')]]")
		).toEqual({ number: 16, name: "Season 16 (The Key to Time)" });
	});

	it("strips wiki article suffix from series link", () => {
		expect(parseSeasonHeading("[[Series 1 (Doctor Who)|Series 1]]")).toEqual({
			number: 1,
			name: "Series 1",
		});
	});

	it("handles series with italic subtitle", () => {
		expect(
			parseSeasonHeading("[[Series 13 (Doctor Who)|Series 13 (''Flux'')]]")
		).toEqual({ number: 13, name: "Series 13 (Flux)" });
	});

	it("returns null for specials with no season number", () => {
		expect(
			parseSeasonHeading(
				"[[Series 4 (Doctor Who)#2008-10 Specials|2008-10 specials]]"
			)
		).toBeNull();
	});
});

describe("extractFirstYear", () => {
	it("extracts the first release year", () => {
		expect(
			extractFirstYear(
				"[[23 November (releases)|23 November]]–[[14 December (releases)|14 December]] [[1963 (releases)|1963]]"
			)
		).toBe(1963);
	});

	it("extracts bare year after a date link (modern series format)", () => {
		expect(
			extractFirstYear(
				"[[25 December (releases)|25 December]] 2005"
			)
		).toBe(2005);
	});

	it("ignores linked years in intro prose, uses table year", () => {
		// Simulates Series 14 intro: references [[2005]] in prose before {| table
		expect(
			extractFirstYear(
				"since [[2005 (releases)|2005]]'s Christmas special.\n{|\n|[[25 December (releases)|25 December]] 2024\n|}"
			)
		).toBe(2024);
	});

	it("picks the earlier of linked vs bare when both appear in the table", () => {
		// Simulates Season 26: bare 1989 rows then a linked [[1993]] special row
		expect(
			extractFirstYear(
				"{|\n|[[27 September (releases)|27 September]] 1989\n|[[1993 (releases)|1993]]\n|}"
			)
		).toBe(1989);
	});

	it("returns null when no year present", () => {
		expect(extractFirstYear("no years here")).toBeNull();
	});
});

describe("parseSeasons", () => {
	const seasons = parseSeasons(wikitext);

	it("parses Season 1 as First Doctor, year 1963", () => {
		const s = seasons.find((s) => s.name === "Season 1");
		expect(s).toMatchObject({ eraId: 1, number: 1, year: 1963 });
	});

	it("assigns transitional Season 4 to First Doctor (earlier era)", () => {
		const matches = seasons.filter((s) => s.name === "Season 4");
		expect(matches).toHaveLength(1);
		expect(matches[0]).toMatchObject({ eraId: 1 });
	});

	it("assigns transitional Season 21 to Fifth Doctor (earlier era)", () => {
		const matches = seasons.filter((s) => s.name === "Season 21");
		expect(matches).toHaveLength(1);
		expect(matches[0]).toMatchObject({ eraId: 5 });
	});

	it("parses Season 4 year as 1966, not a later reference year", () => {
		const s = seasons.find((s) => s.name === "Season 4");
		expect(s).toMatchObject({ year: 1966 });
	});

	it("parses Season 26 as Seventh Doctor, year 1989", () => {
		const s = seasons.find((s) => s.name === "Season 26");
		expect(s).toMatchObject({ eraId: 7, number: 26, year: 1989 });
	});

	it("parses Season 16 with Key to Time subtitle", () => {
		const s = seasons.find((s) => s.name === "Season 16 (The Key to Time)");
		expect(s).toMatchObject({ eraId: 4, number: 16 });
	});

	it("parses Season 23 with Trial of a Time Lord subtitle", () => {
		const s = seasons.find(
			(s) => s.name === "Season 23 (The Trial of a Time Lord)"
		);
		expect(s).toMatchObject({ eraId: 6, number: 23 });
	});

	it("parses Series 1 as Ninth Doctor, year 2005", () => {
		const s = seasons.find((s) => s.name === "Series 1");
		expect(s).toMatchObject({ eraId: 9, number: 1, year: 2005 });
	});

	it("parses Series 13 Flux as Thirteenth Doctor, year 2021", () => {
		const s = seasons.find((s) => s.name === "Series 13 (Flux)");
		expect(s).toMatchObject({ eraId: 13, number: 13, year: 2021 });
	});

	it("parses Series 14 as Fifteenth Doctor, year 2023", () => {
		const s = seasons.find((s) => s.name === "Series 14");
		expect(s).toMatchObject({ eraId: 15, number: 14, year: 2023 });
	});

	it("excludes 2008-10 specials", () => {
		expect(seasons.find((s) => s.name.includes("2008"))).toBeUndefined();
	});

	it("excludes 2013 specials", () => {
		expect(seasons.find((s) => s.name.includes("2013"))).toBeUndefined();
	});

	it("has no duplicate names", () => {
		const names = seasons.map((s) => s.name);
		expect(names).toHaveLength(new Set(names).size);
	});
});
