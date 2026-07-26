// PRINTED IN CHAPTER 10 as `ch10/tools.ts`.
//
// The function comes first and the metadata second, where chapter 3's
// `defineTool` had them the other way round. The handlers are chapter 3's
// plain functions, unchanged.
import { tool } from "langchain";
import { z } from "zod";
import { findOrder, issueRefund } from "../ch03/orders.js";
import { RefundInput } from "../ch03/schema.js";

export const getOrderStatus = tool(
  async ({ order_id }) => JSON.stringify(await findOrder(order_id)),
  {
    name: "get_order_status",
    description:
      "Look up one Braxby Cycles order by its order number. Returns " +
      "the status and the order total in cents.",
    schema: z.object({
      order_id: z.string().describe("The order number, like ORD-4471."),
    }),
  },
);

export const refund = tool(async (input) => issueRefund(input), {
  name: "issue_refund",
  description:
    "Refund part or all of an order that has already been paid for.",
  schema: RefundInput,
});

export const TOOLS = [getOrderStatus, refund];
