import { type Static, Type } from "@sinclair/typebox";

import { paginationQuery } from "@/api/basic/Pagination.js";

export const Episode = Type.Object({
	id: Type.Integer({ minimum: 1, description: "Auto-incremented episode ID" }),
	story_id: Type.Integer({
		minimum: 1,
		description: "Story this episode belongs to",
	}),
	era_id: Type.Integer({ minimum: 1, description: "Doctor era" }),
	season_id: Type.Union([
		Type.Integer({ minimum: 1, description: "Season" }),
		Type.Null(),
	]),
	title: Type.String({
		description: "Story title (classic episodes share the story title)",
	}),
	air_date: Type.Union([
		Type.String({
			format: "date",
			description: "Original air date (YYYY-MM-DD)",
		}),
		Type.Null(),
	]),
	part_number: Type.Union([
		Type.Integer({
			minimum: 1,
			description: "Part number within the story (classic multi-part)",
		}),
		Type.Null(),
	]),
});

export type EpisodeRow = Static<typeof Episode>;

export const EpisodeIdParam = Type.Object({
	id: Type.Integer({ minimum: 1, description: "Episode ID" }),
});

export const EpisodeQuerystring = Type.Composite([
	paginationQuery,
	Type.Object({
		era_id: Type.Optional(
			Type.Integer({ minimum: 1, description: "Filter by Doctor era" })
		),
		season_id: Type.Optional(
			Type.Integer({ minimum: 1, description: "Filter by season" })
		),
	}),
]);
