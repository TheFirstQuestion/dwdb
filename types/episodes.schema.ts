import { type Static, Type } from "@sinclair/typebox";

import { eraIdSchema } from "./eras.schema.js";
import { seasonIdSchema } from "./seasons.schema.js";
import { paginationQuery } from "./util/pagination.schema.js";

export const episodeIdSchema = Type.Integer({
	minimum: 1,
	description: "Auto-incremented episode ID",
});
export const EpisodeIdParam = Type.Object({
	id: episodeIdSchema,
});

export const storyIdSchema = Type.Integer({
	minimum: 1,
	description: "Story this episode belongs to",
});
export const StoryIdParam = Type.Object({
	id: storyIdSchema,
});

export const Episode = Type.Object({
	id: episodeIdSchema,
	story_id: storyIdSchema,
	era_id: eraIdSchema,
	season_id: Type.Union([
		seasonIdSchema,
		Type.Null({ description: "Specials" }),
	]),
	// TODO: reword
	title: Type.String({
		description: "Story title (classic episodes share the story title)",
	}),
	air_date: Type.Union([
		Type.String({
			format: "date",
			description: "Original air date (YYYY-MM-DD)",
		}),
		// TODO: why would an air date be null?
		Type.Null(),
	]),
	part_number: Type.Union([
		Type.Integer({
			minimum: 1,
			description: "Part number within the story (classic multi-part)",
		}),
		// TODO: why null? one-parter is vacuously 1
		Type.Null(),
	]),
});
export type EpisodeRow = Static<typeof Episode>;

export const EpisodeQuerystring = Type.Composite([
	paginationQuery,
	Type.Object({
		era_id: Type.Optional(eraIdSchema),
		season_id: Type.Optional(seasonIdSchema),
	}),
]);
