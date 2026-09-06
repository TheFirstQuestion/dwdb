import { createFetch, FetchError } from "ofetch";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, request } from "../app/utils/api-request";

const apiUrl = "http://localhost:3000";

function stubRuntimeConfig() {
	vi.stubGlobal("useRuntimeConfig", () => ({ public: { apiUrl } }));
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("request", () => {
	it("returns the parsed JSON body on success", async () => {
		stubRuntimeConfig();
		vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ id: 1 }));

		await expect(request("/eras/1")).resolves.toEqual({ id: 1 });
	});

	it("wraps a failed request in an ApiError, preserving status and body", async () => {
		stubRuntimeConfig();
		const fetchError = new FetchError("Request failed");
		fetchError.status = 404;
		fetchError.data = { error: "Era not found" };
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(fetchError));

		const rejection = request("/eras/999").catch((error) => error);

		await expect(rejection).resolves.toBeInstanceOf(ApiError);
		await expect(rejection).resolves.toMatchObject({
			message: "Era not found",
			status: 404,
			body: { error: "Era not found" },
		});
	});

	it("falls back to a generic message when the error body carries none", async () => {
		stubRuntimeConfig();
		const fetchError = new FetchError("Request failed");
		fetchError.status = 500;
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(fetchError));

		const rejection = request("/eras/1").catch((error) => error);

		await expect(rejection).resolves.toMatchObject({
			message: "Request to /eras/1 failed with status 500",
			status: 500,
			body: null,
		});
	});

	it("rethrows errors that aren't shaped like a fetch error", async () => {
		stubRuntimeConfig();
		const error = new Error("network down");
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(error));

		await expect(request("/eras/1")).rejects.toBe(error);
	});
});

// ofetch's `query` option is what request() relies on instead of the old
// hand-rolled `buildQuery`; confirm it drops undefined-valued keys the same
// way, using the real ofetch (not a stub of our own assumption about it).
describe("$fetch query option", () => {
	it("omits undefined-valued keys from the request URL", async () => {
		let capturedUrl: string | undefined;
		const fakeFetch = vi.fn(async (input: string | URL | Request) => {
			capturedUrl = input.toString();
			return new Response(JSON.stringify({}), {
				headers: { "content-type": "application/json" },
			});
		});
		const customFetch = createFetch({ fetch: fakeFetch as typeof fetch });

		await customFetch("/seasons", {
			baseURL: apiUrl,
			query: { era_id: 3, page_num: undefined },
		});

		if (capturedUrl === undefined) throw new Error("fetch was not called");
		const url = new URL(capturedUrl);
		expect(url.searchParams.get("era_id")).toBe("3");
		expect(url.searchParams.has("page_num")).toBe(false);
	});
});
