// ch12/single.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain";
import { workshopTools } from "./tools.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 4096,
});

// The order the team's diagram encodes, written down instead of
// drawn. Nothing here needs a second model to enforce it.
const SYSTEM = [
  "You handle warranty repairs for a bike workshop.",
  "Work in this order and do not skip a step:",
  "1. lookup_order for the purchase and the frame number.",
  "2. check_warranty with that frame number and date.",
  "3. find_parts only if the claim is in cover.",
  "4. order_part once the cost has been approved.",
  "5. book_workshop_slot after the part is confirmed.",
  "6. notify_customer last, quoting the slot and the cost.",
  "If a step fails, say which step and stop.",
].join("\n");

export const oneAgent = createAgent({
  model,
  tools: workshopTools,
  systemPrompt: SYSTEM,
});
