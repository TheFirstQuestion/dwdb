import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { extractYears, extractActor, parseEras } from "../seeds/era-parser.js";

const WIKI_PAGE = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"wiki-data",
	"pages",
	"List_of_Doctor_Who_television_stories.json"
);

const raw = JSON.parse(readFileSync(WIKI_PAGE, "utf-8"));
const wikitext = Object.values(raw.query.pages as Record<string, unknown>).map(
	(p: unknown) => {
		const page = p as {
			revisions: Array<{ slots: { main: { "*": string } } }>;
		};
		return page.revisions[0].slots.main["*"];
	}
)[0];

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
		const era = eras.find((e) => e.doctorNumber === 1);
		expect(era).toMatchObject({
			doctorNumber: 1,
			actor: "William Hartnell",
			startYear: 1963,
			endYear: 1966,
		});
	});

	it("parses Ninth Doctor as Eccleston, not Rowan Atkinson", () => {
		const era = eras.find((e) => e.doctorNumber === 9);
		expect(era).toMatchObject({
			doctorNumber: 9,
			actor: "Christopher Eccleston",
			startYear: 2005,
			endYear: 2005,
		});
	});

	it("parses Seventh Doctor end year as 1996 (TV Movie appearance)", () => {
		const era = eras.find((e) => e.doctorNumber === 7);
		expect(era).toMatchObject({
			doctorNumber: 7,
			actor: "Sylvester McCoy",
			startYear: 1987,
			endYear: 1996,
		});
	});

	it("parses Tenth Doctor correctly", () => {
		const era = eras.find((e) => e.doctorNumber === 10);
		expect(era).toMatchObject({
			doctorNumber: 10,
			actor: "David Tennant",
			startYear: 2005,
		});
	});

	it("parses Fourteenth Doctor as David Tennant", () => {
		const era = eras.find((e) => e.doctorNumber === 14);
		expect(era).toMatchObject({
			doctorNumber: 14,
			actor: "David Tennant",
			startYear: 2022,
		});
	});
});
