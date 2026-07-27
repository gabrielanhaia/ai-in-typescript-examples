// NOT A LISTING FROM THE BOOK.
//
// Four rows of the chapter's checklist, as assertions. No key, no container,
// no network, milliseconds — which is possible only because `route`,
// `advance` and `collect` are ordinary functions over a plain object, and
// that is the reason the chapter gives each of them a file of its own.
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { expect, it } from "vitest";
import { advance, collect } from "./nodes.js";
import { route } from "./route.js";
import { TOOLS } from "./shop.js";
import type { Job } from "./state.js";

const PLAN = [...TOOLS];

function job(over: Partial<Job> = {}): Job {
  return {
    messages: [new HumanMessage("The rear hub is grinding.")],
    customerId: "cust-4417",
    steps: PLAN,
    cursor: 0,
    results: {},
    known: [],
    ...over,
  };
}

it("routes work, delegate and finish and nothing else", () => {
  expect(PLAN.map((_, cursor) => route(job({ cursor })))).toEqual([
    "work",
    "work",
    "delegate",
    "delegate",
    "work",
    "work",
  ]);
  // Past the end of the plan is the only way the run finishes.
  expect(route(job({ cursor: PLAN.length }))).toBe("finish");
});

it("records one specialist report against both parts steps", () => {
  const report = "HUB-VR-142, Coldharbour, GBP 68.40, ref PO-1001";
  const update = collect(
    job({ cursor: 2, messages: [new AIMessage(report)] }),
  );

  expect(update.results).toEqual({
    find_parts: report,
    order_part: report,
  });
});

it("advances to the first step with no result, from anywhere", () => {
  const settled = {
    lookup_order: "ORD-4471",
    check_warranty: "in cover",
    find_parts: "HUB-VR-142",
    order_part: "PO-1001",
  };

  // A resumed thread runs `advance` again and has to land where a
  // fresh one would. Idempotent is the property, not "add one".
  expect(advance(job({ cursor: 0, results: settled })).cursor).toBe(4);
  expect(advance(job({ cursor: 4, results: settled })).cursor).toBe(4);
});

it("a refusal is an outcome the graph carries, not an error", async () => {
  const { decide } = await import("./decide.js");
  const outcome = decide(
    {
      action: "order_part",
      summary: "Order HUB-VR-142 from Coldharbour for GBP 68.40.",
      code: "HUB-VR-142",
      supplier: "Coldharbour Distribution",
      priceGbp: 68.4,
      frameNumber: "VER-8802",
    },
    { type: "reject", reason: "Customer wants a quote first." },
  );

  expect(outcome).toEqual({
    kind: "decline",
    note: "Order declined: Customer wants a quote first.",
  });
});
