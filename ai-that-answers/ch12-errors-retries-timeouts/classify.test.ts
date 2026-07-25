import { expect, test } from "vitest";
import { APIError } from "@anthropic-ai/sdk";
import { classify } from "./classify.js";

const apiError = (status: number | undefined, type: string) =>
  new APIError(status, { type: "error", error: { type } }, undefined, undefined);

test("rate limits and server errors are retried", () => {
  expect(classify(apiError(429, "rate_limit_error"))).toBe("retry");
  expect(classify(apiError(529, "overloaded_error"))).toBe("retry");
});

test("a rejected parameter is never retried", () => {
  expect(classify(apiError(400, "invalid_request_error"))).toBe("fix");
});

test("a mid-stream error has no status and is still transient", () => {
  expect(classify(apiError(undefined, "overloaded_error"))).toBe("retry");
});
