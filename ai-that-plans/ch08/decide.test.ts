// NOT A LISTING FROM THE BOOK.
//
// `ch08/gate.test.ts` is the chapter's own test file and it asserts two things:
// the edit branch, and that the graph stops in front of the money. This file
// finishes the job on the pure half — all three answers, and the two properties
// the chapter claims for the pair of shapes around them:
//
//   * the decision is a function of plain values, so it needs no graph, no
//     checkpointer and no supplier to be tested;
//   * `Proposal` and `Decision` cross a process and a serialization boundary,
//     so whatever survives JSON has to be enough to decide with.
//
// No key, no container, no network.
import { expect, it } from "vitest";
import type { Decision, Proposal } from "./approval.js";
import { decide } from "./decide.js";

const proposal: Proposal = {
  action: "order_part",
  summary:
    "Order Verano rear hub, 142mm (HUB-VR-142) from Coldharbour " +
    "Distribution for GBP 68.40.",
  code: "HUB-VR-142",
  supplier: "Coldharbour Distribution",
  priceGbp: 68.4,
  frameNumber: "VER-8802",
};

it("approve places exactly what was proposed", () => {
  expect(decide(proposal, { type: "approve" })).toEqual({
    kind: "place",
    code: "HUB-VR-142",
    supplier: "Coldharbour Distribution",
  });
});

it("reject is an outcome the graph carries, not an error", () => {
  const outcome = decide(proposal, {
    type: "reject",
    reason: "Customer wants a quote first.",
  });

  expect(outcome).toEqual({
    kind: "decline",
    note: "Order declined: Customer wants a quote first.",
  });
});

it("edit takes the human's part and the human's supplier, not the proposal's", () => {
  const outcome = decide(proposal, {
    type: "edit",
    code: "HUB-VR-142-B",
    supplier: "Marchmont Wheelworks",
    priceGbp: 61,
  });

  expect(outcome).toEqual({
    kind: "place",
    code: "HUB-VR-142-B",
    supplier: "Marchmont Wheelworks",
  });
});

it("decides the same after a round trip through JSON", () => {
  // The proposal is written into a checkpoint and read back by another
  // process, possibly on another day. Anything that does not survive
  // JSON.stringify is not part of the gate, whatever the type says.
  const stored = JSON.parse(JSON.stringify(proposal)) as Proposal;
  const answer = JSON.parse(
    JSON.stringify({ type: "approve" } satisfies Decision),
  ) as Decision;

  expect(decide(stored, answer)).toEqual(decide(proposal, { type: "approve" }));
});

it("never places an order without a code and a supplier to place it with", () => {
  const answers: Decision[] = [
    { type: "approve" },
    { type: "edit", code: "X-1", supplier: "Marchmont", priceGbp: 1 },
    { type: "reject", reason: "no" },
  ];

  for (const answer of answers) {
    const outcome = decide(proposal, answer);
    if (outcome.kind !== "place") continue;
    expect(outcome.code).not.toBe("");
    expect(outcome.supplier).not.toBe("");
  }
});
