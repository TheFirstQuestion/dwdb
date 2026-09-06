import { type Static, Type } from "@sinclair/typebox";

import { eraIdSchema } from "./eras.schema.js";
import { paginationQuery } from "./util/pagination.schema.js";

export const seasonIdSchema = Type.Integer({
	minimum: 1,
	description: "Auto-incremented season ID",
});
export const SeasonIdParam = Type.Object({
	id: seasonIdSchema,
});

export const Season = Type.Object({
	id: seasonIdSchema,
	era_id: eraIdSchema,
	number: Type.Integer({
		minimum: 1,
		// TODO: unclear
		description: "Season number within its era type (Classic or Modern)",
	}),
	name: Type.String({
		description: "Display name, e.g. 'Season 1' or 'Series 13 (Flux)'",
	}),
	year: Type.Integer({
		minimum: 1963,
		description: "Year the season first aired",
	}),
});
export type SeasonRow = Static<typeof Season>;

export const SeasonQuerystring = Type.Composite([
	paginationQuery,
	Type.Object({
		era_id: Type.Optional(eraIdSchema),
	}),
]);
