import { type Static, Type } from "@sinclair/typebox";

export const errorMessage = Type.Object({
	error: Type.String({ minLength: 1 }),
	code: Type.Integer({ minimum: 1 }),
});

export const errorResponses = {
	"4xx": errorMessage,
	"5xx": errorMessage,
};

export class ErrorMessage implements Static<typeof errorMessage> {
	error: string;
	code: number;

	constructor(error: string, code = 500) {
		this.error = error;
		this.code = code;
	}
}
