import { Type } from "@sinclair/typebox";

export const Era = Type.Object({
	id: Type.Integer({
		minimum: 1,
		description:
			"Canonical Doctor number (e.g. 1=Hartnell, 10=Tennant, 14=Tennant)",
	}),
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
			Type.Null(),
		],
		{
			description: "Year this era ended, or null if ongoing",
		}
	),
});

export const EraIdParam = Type.Object({
	id: Type.Integer({ minimum: 1, description: "Doctor number" }),
});
