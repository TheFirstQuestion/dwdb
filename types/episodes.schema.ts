import { type Static, Type } from "@sinclair/typebox";

import { eraIdSchema } from "./eras.schema.js";
import { seasonIdSchema } from "./seasons.schema.js";
import { paginationQuery } from "./util/pagination.schema.js";

export const episodeIdSchema = Type.Integer({
	minimum: 1,
	description: "Auto-incremented episode ID",
});
export const episodeIdParam = Type.Object({
	id: episodeIdSchema,
});

export const storyIdSchema = Type.Integer({
	minimum: 1,
	description: "Story this episode belongs to",
});
export const storyIdParam = Type.Object({
	id: storyIdSchema,
});

export const episode = Type.Object({
	id: episodeIdSchema,
	story_id: storyIdSchema,
	era_id: eraIdSchema,
	// Absent for specials
	season_id: Type.Optional(seasonIdSchema),
	// TODO: reword
	title: Type.String({
		description: "Story title (classic episodes share the story title)",
	}),
	// TODO: why would an air date be undefined?
	air_date: Type.Optional(
		Type.String({
			format: "date",
			description: "Original air date (YYYY-MM-DD)",
		})
	),
	// TODO: why null? one-parter is vacuously 1
	part_number: Type.Optional(
		Type.Integer({
			minimum: 1,
			description: "Part number within the story (classic multi-part)",
		})
	),
});
export type Episode = Static<typeof episode>;

export const EpisodeQuerystring = Type.Composite([
	paginationQuery,
	Type.Object({
		era_id: Type.Optional(eraIdSchema),
		season_id: Type.Optional(seasonIdSchema),
	}),
]);
export type EpisodeQuerystringParams = Static<typeof EpisodeQuerystring>;

export type EpisodeFilter = {
	column: "era_id" | "season_id";
	value: number;
};
