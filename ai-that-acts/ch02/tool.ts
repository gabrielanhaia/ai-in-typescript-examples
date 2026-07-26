// PRINTED IN CHAPTER 2 as `ch02/tool.ts` — "the definition above lives here
// too, exported".
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const getOrderStatus: Tool = {
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

export interface OrderStatus {
  readonly order_id: string;
  readonly status: string;
  readonly carrier: string | null;
  readonly tracking: string | null;
}

export function lookUpOrder(input: { order_id: string }): OrderStatus {
  return {
    order_id: input.order_id,
    status: "dispatched",
    carrier: "Evri",
    tracking: "H00A1234567890",
  };
}
