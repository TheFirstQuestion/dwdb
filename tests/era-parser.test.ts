import { describe, it, expect } from "vitest";
import { extractYears, extractActor, parseEras } from "../seeds/era-parser.js";
import { loadWikitext } from "./helpers.js";

const wikitext = loadWikitext();

describe("extractYears", () => {
	it("extracts a single year", () => {
		expect(extractYears("from [[2005 (production)|2005]] onwards")).toEqual([
			2005,
		]);
	});

	it("extracts multiple years", () => {
		expect(
			extractYears(
				"from [[1987 (production)|1987]] to [[1989 (production)|1989]], and in [[1996 (production)|1996]]"
			)
		).toEqual([1987, 1989, 1996]);
	});

	it("returns empty array when no years present", () => {
		expect(extractYears("no years here")).toEqual([]);
	});
});

describe("extractActor", () => {
	it("extracts a simple actor name", () => {
		expect(
			extractActor(
				"portrayed by [[William Hartnell]] from [[1963 (production)|1963]]"
			)
		).toBe("William Hartnell");
	});

	it("extracts actor name with pipe alias", () => {
		expect(
			extractActor(
				"portrayed by [[Jodie Whittaker|some alias]] from [[2017 (production)|2017]]"
			)
		).toBe("Jodie Whittaker");
	});

	it("returns null when no actor present", () => {
		expect(extractActor("no actor here")).toBeNull();
	});
});

describe("parseEras", () => {
	const eras = parseEras(wikitext);

	it("parses First Doctor correctly", () => {
		const era = eras.find((e) => e.id === 1);
		expect(era).toMatchObject({
			id: 1,
			actor: "William Hartnell",
			start_year: 1963,
			end_year: 1966,
		});
	});

	it("parses Ninth Doctor as Eccleston, not Rowan Atkinson", () => {
		const era = eras.find((e) => e.id === 9);
		expect(era).toMatchObject({
			id: 9,
			actor: "Christopher Eccleston",
			start_year: 2005,
			end_year: 2005,
		});
	});

	it("parses Seventh Doctor end year as 1996 (TV Movie appearance)", () => {
		const era = eras.find((e) => e.id === 7);
		expect(era).toMatchObject({
			id: 7,
			actor: "Sylvester McCoy",
			start_year: 1987,
			end_year: 1996,
		});
	});

	it("parses Tenth Doctor correctly", () => {
		const era = eras.find((e) => e.id === 10);
		expect(era).toMatchObject({
			id: 10,
			actor: "David Tennant",
			start_year: 2005,
		});
	});

	it("parses Fourteenth Doctor as David Tennant", () => {
		const era = eras.find((e) => e.id === 14);
		expect(era).toMatchObject({
			id: 14,
			actor: "David Tennant",
			start_year: 2022,
		});
	});
});
