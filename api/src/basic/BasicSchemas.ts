import { type Static, Type } from "@sinclair/typebox";

export const errorMessage = Type.Object({
	error: Type.String(),
});
export type ErrorMessage = Static<typeof errorMessage>;
