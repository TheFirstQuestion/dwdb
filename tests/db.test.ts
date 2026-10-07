import { describe, expect, it } from "vitest";

import { nullToUndefined } from "@/api/plugins/db.js";

describe("nullToUndefined", () => {
	it("converts null to undefined", () => {
		expect(nullToUndefined(null)).toBeUndefined();
	});

	it("passes non-null values through unchanged", () => {
		expect(nullToUndefined(1)).toBe(1);
		expect(nullToUndefined("Rose")).toBe("Rose");
		expect(nullToUndefined(0)).toBe(0);
		expect(nullToUndefined("")).toBe("");
	});
});
