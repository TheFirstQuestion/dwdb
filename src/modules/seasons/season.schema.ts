import { Type, type Static } from "@sinclair/typebox";

export const Season = Type.Object({
	id: Type.Integer({ minimum: 1, description: "Auto-incremented season ID" }),
	era_id: Type.Integer({ minimum: 1, description: "Doctor era this season belongs to" }),
	number: Type.Integer({ minimum: 1, description: "Season number within its era type (Classic or Modern)" }),
	name: Type.String({ description: "Display name, e.g. 'Season 1' or 'Series 13 (Flux)'" }),
	year: Type.Integer({ minimum: 1963, description: "Year the season first aired" }),
});

export type SeasonRow = Static<typeof Season>;

export const SeasonIdParam = Type.Object({
	id: Type.Integer({ minimum: 1, description: "Season ID" }),
});

export const SeasonQuerystring = Type.Object({
	era_id: Type.Optional(Type.Integer({ minimum: 1, description: "Filter by Doctor era" })),
});
