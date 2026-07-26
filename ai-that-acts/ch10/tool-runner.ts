// PRINTED IN CHAPTER 10 as `ch10/tool-runner.ts` — the SDK's middle rung.
//
// Import from `@anthropic-ai/sdk/helpers/beta/zod`; guessing that path is a
// good way to lose an afternoon. `max_iterations` plays the role the step
// ceiling played in the hand loop. Beta, so expect it to move.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { findOrder } from "../ch03/orders.js";

const client = new Anthropic();

const getOrderStatus = betaZodTool({
  name: "get_order_status",
  description: "Look up one Braxby Cycles order by its order number.",
  inputSchema: z.object({
    order_id: z.string().describe("The order number, like ORD-4471."),
  }),
  run: async ({ order_id }) => JSON.stringify(await findOrder(order_id)),
});

const runner = client.beta.messages.toolRunner({
  model: "claude-sonnet-5",
  max_tokens: 8192,
  max_iterations: 8,
  tools: [getOrderStatus],
  messages: [{ role: "user", content: "Where is order ORD-4471?" }],
});

for await (const message of runner) {
  console.log(message.stop_reason);
}
