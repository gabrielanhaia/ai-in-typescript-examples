// PRINTED IN CHAPTER 2 as `ch02/first-call.ts`.
import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

const client = new Anthropic();

const getOrderStatus: Tool = {
  name: "get_order_status",
  description:
    "Look up the current status of one Braxby Cycles order by its " +
    "order number. Returns the status, the carrier, and the tracking " +
    "number if the parcel has shipped.",
  input_schema: {
    type: "object",
    properties: {
      order_id: {
        type: "string",
        description: "The order number, in the form ORD-4471.",
      },
    },
    required: ["order_id"],
    additionalProperties: false,
  },
};

const reply = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 8192,
  tools: [getOrderStatus],
  messages: [{ role: "user", content: "Where is order ORD-4471?" }],
});

console.log(JSON.stringify(reply, null, 2));
