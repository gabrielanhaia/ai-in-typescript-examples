// ch04/route.test.ts
import { describe, expect, it } from "vitest";
import { decide, MAX_ATTEMPTS } from "./route.js";
import type { State } from "./state.js";

const base: State = {
  messages: [],
  steps: ["lookup_order", "check_warranty"],
  cursor: 0,
  attempts: 0,
  lastError: "",
  completed: [],
};

describe("decide", () => {
  it("continues while the plan has steps left", () => {
    expect(decide(base)).toBe("continue");
  });

  it("finishes on the last step", () => {
    expect(decide({ ...base, cursor: 1 })).toBe("finish");
  });

  it("retries a failed step until the cap", () => {
    const failed = { ...base, lastError: "supplier timed out" };
    expect(decide({ ...failed, attempts: 1 })).toBe("retry");
    expect(decide({ ...failed, attempts: MAX_ATTEMPTS })).toBe("finish");
  });
});
