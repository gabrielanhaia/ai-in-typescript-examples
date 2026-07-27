// NOT A LISTING FROM THE BOOK.
//
// The chapter's claim, checked: "every one of the three causes above
// reproduces in a unit test with a hand-built state object and no network."
//
// No graph is compiled here, no checkpointer is opened, no key is read. The
// snapshots are literals, because a StateSnapshot is a plain object and the
// two detectors in this chapter are plain functions over plain objects — which
// is the reason they can be trusted at four in the afternoon.
import { describe, expect, it } from "vitest";
import type { StateSnapshot } from "@langchain/langgraph";
import { fingerprint, pick, stable } from "./fingerprint.js";
import { findRepeat } from "./loop.js";
import { decide, MAX_ATTEMPTS } from "./route.js";
import { PROGRESS, type State } from "./state.js";
import { pendingPause } from "./stalled.js";

interface SnapFields {
  step: number;
  next: string[];
  values: Record<string, unknown>;
  interrupts?: { id: string; value: unknown }[];
  createdAt?: string;
}

function snap(fields: SnapFields): StateSnapshot {
  return {
    values: fields.values,
    next: fields.next,
    config: {},
    metadata: {
      source: "loop",
      step: fields.step,
      parents: {},
    },
    createdAt: fields.createdAt,
    tasks: fields.next.map((name, index) => ({
      id: `t${index}`,
      name,
      interrupts: fields.interrupts ?? [],
    })),
  } as StateSnapshot;
}

/** The chapter's four fields, with only the ones a test cares about set. */
function stateAt(fields: Partial<State>): State {
  return {
    messages: [],
    steps: ["lookup_order", "check_warranty", "find_parts"],
    cursor: 0,
    attempts: 1,
    lastError: "",
    completed: [],
    ...fields,
  };
}

describe("stable", () => {
  it("does not care what order the keys arrived in", () => {
    expect(stable({ a: 1, b: [2, 3] })).toBe(stable({ b: [2, 3], a: 1 }));
  });

  it("treats undefined as absent, the way a JSON round-trip does", () => {
    expect(stable({ a: 1, b: undefined })).toBe(stable({ a: 1 }));
  });

  it("gives one digest to two spellings of one state", () => {
    const left = { cursor: 2, steps: ["a"], completed: [] };
    const right = { completed: [], steps: ["a"], cursor: 2 };
    expect(fingerprint(left)).toBe(fingerprint(right));
  });

  it("gives different digests to different states", () => {
    expect(fingerprint({ cursor: 2 })).not.toBe(fingerprint({ cursor: 3 }));
  });
});

describe("pick", () => {
  it("keeps progress and drops effort", () => {
    const values = {
      steps: ["a"],
      cursor: 1,
      completed: ["a"],
      attempts: 7,
      lastError: "boom",
      messages: [1, 2, 3],
    };
    expect(Object.keys(pick(values, PROGRESS)).sort()).toEqual([
      "completed",
      "cursor",
      "steps",
    ]);
  });
});

describe("findRepeat", () => {
  const moving = { steps: ["a", "b"], cursor: 0, completed: [] };
  const stuck = { steps: ["a", "b"], cursor: 1, completed: ["a"] };

  it("names the cycle, the laps and the step it started at", () => {
    const found = findRepeat(
      [
        snap({ step: 0, next: ["plan"], values: moving }),
        snap({ step: 1, next: ["execute"], values: stuck }),
        snap({ step: 2, next: ["execute"], values: stuck }),
        snap({ step: 3, next: ["execute"], values: stuck }),
        snap({ step: 4, next: ["execute"], values: stuck }),
      ],
      PROGRESS,
    );
    expect(found).toBeDefined();
    expect(found?.cycle).toEqual(["execute"]);
    expect(found?.laps).toBe(4);
    expect(found?.fromStep).toBe(1);
  });

  it("does not call a single retry a loop", () => {
    const found = findRepeat(
      [
        snap({ step: 0, next: ["execute"], values: moving }),
        snap({ step: 1, next: ["execute"], values: stuck }),
        snap({ step: 2, next: ["advance"], values: stuck }),
      ],
      PROGRESS,
    );
    expect(found).toBeUndefined();
  });

  it("goes blind when an effort channel is in the list", () => {
    const laps = [1, 2, 3, 4, 5].map((n) =>
      snap({
        step: n,
        next: ["execute"],
        values: { ...stuck, attempts: n },
      }),
    );
    expect(findRepeat(laps, PROGRESS)).toBeDefined();
    expect(findRepeat(laps, [...PROGRESS, "attempts"])).toBeUndefined();
  });
});

describe("pendingPause", () => {
  const question = [{ id: "i1", value: { code: "HUB-VR-142", priceGbp: 68.4 } }];

  it("reads the node, the question and how long it has waited", () => {
    const found = pendingPause(
      snap({
        step: 5,
        next: ["execute"],
        values: {},
        interrupts: question,
        createdAt: "2026-07-21T09:00:00.000Z",
      }),
      Date.parse("2026-07-21T09:00:10.000Z"),
    );
    expect(found?.node).toBe("execute");
    expect(found?.value).toEqual({ code: "HUB-VR-142", priceGbp: 68.4 });
    expect(found?.waitingMs).toBe(10_000);
  });

  it("says nothing about a thread that reached END", () => {
    expect(
      pendingPause(snap({ step: 9, next: [], values: {} })),
    ).toBeUndefined();
  });

  it("says nothing about a thread that is merely mid-run", () => {
    expect(
      pendingPause(snap({ step: 3, next: ["execute"], values: {} })),
    ).toBeUndefined();
  });

  it("omits waitingMs when the checkpointer stored no timestamp", () => {
    const found = pendingPause(
      snap({ step: 5, next: ["execute"], values: {}, interrupts: question }),
    );
    expect(found).toBeDefined();
    expect(found?.waitingMs).toBeUndefined();
  });
});

describe("the three loop causes, without a network", () => {
  it("cause 1: a flag the router reads is never cleared", () => {
    // lastError set, attempts under the ceiling: retry, for ever, because
    // only a successful execute empties lastError.
    expect(decide(stateAt({ lastError: "gone", attempts: 1 }))).toBe("retry");
  });

  it("cause 2: the counter the router bounds is reset on the loop path", () => {
    // advance resets attempts. Move that into execute and every lap arrives
    // here with attempts back at 1, so MAX_ATTEMPTS is never reached.
    for (let lap = 0; lap < 50; lap += 1) {
      expect(decide(stateAt({ lastError: "gone", attempts: 1 }))).toBe("retry");
    }
    // The bound that was supposed to fire.
    expect(decide(stateAt({ lastError: "gone", attempts: MAX_ATTEMPTS }))).toBe(
      "finish",
    );
  });

  it("cause 3: the router reads a channel the cycle never writes", () => {
    // execute writes attempts and messages; decide reads cursor and steps.
    const before = stateAt({ cursor: 1, attempts: 1 });
    const after = stateAt({ cursor: 1, attempts: 2 });
    expect(decide(before)).toBe(decide(after));
    expect(fingerprint(pick(before, PROGRESS))).toBe(
      fingerprint(pick(after, PROGRESS)),
    );
  });
});
