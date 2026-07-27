// ch14/parts.ts (1 of 2)
import { ChatAnthropic } from "@langchain/anthropic";
import { interrupt } from "@langchain/langgraph";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import type { Decision, Proposal } from "./approval.js";
import { decide } from "./decide.js";
import { findHub, placeOrder } from "./shop.js";

const sonnet = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 4096,
});

const findParts = tool(
  async ({ frame }) => JSON.stringify(await findHub(frame)),
  {
    name: "find_parts",
    description:
      "Find the hub that fits a frame. Returns the part code, " +
      "the supplier and the price.",
    schema: z.object({ frame: z.string() }),
  },
);

// ch14/parts.ts (2 of 2)
const orderPart = tool(
  async ({ code, supplier, priceGbp, frame }) => {
    const proposal: Proposal = {
      action: "order_part",
      summary:
        `Order ${code} from ${supplier} for GBP ` +
        `${priceGbp.toFixed(2)}.`,
      code,
      supplier,
      priceGbp,
      frameNumber: frame,
    };
    // Nothing above this line has an effect, because on resume
    // this function body runs again from the top.
    const answer = interrupt<Proposal, Decision>(proposal);
    const outcome = decide(proposal, answer);
    if (outcome.kind === "decline") return outcome.note;
    const ref = await placeOrder(outcome.code, outcome.supplier);
    return `ordered ${outcome.code}, reference ${ref}`;
  },
  {
    name: "order_part",
    description: "Order a part. Pauses for a human's approval.",
    schema: z.object({
      code: z.string(),
      supplier: z.string(),
      priceGbp: z.number(),
      frame: z.string(),
    }),
  },
);

export const partsSpecialist = createAgent({
  name: "parts",
  description: "Prices, checks stock, and orders a part.",
  model: sonnet,
  tools: [findParts, orderPart],
  systemPrompt:
    "Find the hub that fits the frame, then order it. Report " +
    "the code, the supplier, the price and the order reference " +
    "in one sentence, then stop.",
});
