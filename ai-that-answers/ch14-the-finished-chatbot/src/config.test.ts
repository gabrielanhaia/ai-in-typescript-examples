import { expect, test } from "vitest";
import { AIMessage } from "langchain";
import { ANSWER_TOKENS, MODEL, RESERVE_FOR_ANSWER, SAMPLING } from "./config.js";
import { finishOf } from "./finish.js";

test("the answer cap fits under the model's own output ceiling", () => {
  expect(ANSWER_TOKENS).toBeLessThanOrEqual(MODEL.maxOutputTokens);
});

test("the reserved headroom fits inside the context window", () => {
  expect(RESERVE_FOR_ANSWER).toBeLessThan(MODEL.contextWindow);
});

test("no sampling parameter is sent to a model that rejects it", () => {
  if (!MODEL.acceptsSampling) {
    expect(Object.keys(SAMPLING)).toEqual([]);
  }
});

test("a truncated answer is not reported as a complete one", () => {
  const cut = new AIMessage({
    content: "half a sen",
    response_metadata: { stop_reason: "max_tokens" },
  });
  expect(finishOf(cut)).toEqual({
    kind: "truncated",
    text: "half a sen",
    cause: "output_cap",
  });
});

test("a stop reason nobody has seen before is named, not assumed complete", () => {
  const odd = new AIMessage({
    content: "",
    response_metadata: { stop_reason: "some_future_value" },
  });
  expect(finishOf(odd).kind).toBe("unknown");
});
