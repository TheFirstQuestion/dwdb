import { Type } from "@sinclair/typebox";

export const ErrorMessage = Type.Object({
	error: Type.String(),
});
