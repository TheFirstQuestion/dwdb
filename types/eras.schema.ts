import { type Static, Type } from "@sinclair/typebox";

export const eraIdSchema = Type.Integer({
	minimum: 1,
	description:
		"Canonical Doctor number (e.g. 1=Hartnell, 10=Tennant, 14=Tennant)",
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
