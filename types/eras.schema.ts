import { type Static, Type } from "@sinclair/typebox";

export const eraIdSchema = Type.Integer({
	minimum: 1,
	description: "Canonical Doctor number (1=Hartnell, 10=Tennant, 14=Tennant)",
	examples: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
});

export const eraIdParam = Type.Object({
	id: eraIdSchema,
});

export const era = Type.Object({
	id: eraIdSchema,
	actor: Type.String({
		description: "Name of the actor who played the Doctor in this era",
	}),
	start_year: Type.Integer({
		minimum: 1963,
		description: "Year this era began",
	}),
	end_year: Type.Union(
		[
			Type.Integer({ minimum: 1963, description: "Year this era ended" }),
			Type.Null({ description: "Indicates era is ongoing" }),
		],
		{
			description: "Year this era ended, or null if ongoing",
		}
	),
});
export type Era = Static<typeof era>;

export const eraList = Type.Array(era);
export type EraList = Static<typeof eraList>;

export const eraSearchQuery = Type.Object({
	name: Type.String({
		minLength: 1,
		description:
			"Case-insensitive match against the actor's name; accepts 'First Last', 'First', or 'Last'",
		examples: ["Tennant", "David", "David Tennant"],
	}),
});
export type EraSearchQuery = Static<typeof eraSearchQuery>;
