// ch08/gate.test.ts
//
// The book prints the two `it` blocks and not the file around them. The rest
// of this file is the scaffolding they need and nothing else: the imports,
// and the one proposal both the printed edit test and `orderPart` build the
// same way.
import { isInterrupted } from "@langchain/langgraph";
import { expect, it } from "vitest";
import type { Proposal } from "./approval.js";
import { openCheckpointer } from "./checkpointer.js";
import { decide } from "./decide.js";
import { buildGraph } from "./graph.js";
import { supplier } from "./shop.js";

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

it("uses the human's part when the answer is an edit", () => {
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

it("stops before the graph spends anything", async () => {
  const spent = supplier.ordersPlaced;
  const graph = buildGraph(openCheckpointer("memory"));
  const result = await graph.invoke(
    { frameNumber: "VER-8802" },
    { configurable: { thread_id: "gate-test" } },
  );

  expect(isInterrupted<Proposal>(result)).toBe(true);
  expect(supplier.ordersPlaced).toBe(spent);
});
