// PRINTED IN CHAPTER 5 as `ch05/surface.ts`.
import { z } from "zod";
import { defineTool } from "../ch03/define-tool.js";
import { findOrdersFor } from "../ch03/orders.js";
import { digest } from "./digest.js";

export const findOrders = defineTool(
  "find_orders",
  "Find a customer's recent orders from their email address. Returns " +
    "one line per order: order number, date, status and total. It does " +
    "not return the items on an order — call get_order_status with an " +
    "order number for that. If the customer has already given you an " +
    "order number, use get_order_status directly instead of searching.",
  z.object({
    email: z
      .string()
      .describe("Email address the order was placed with."),
    status: z
      .enum(["paid", "picking", "packed", "dispatched", "delivered"])
      .optional()
      .describe(
        "Only orders in this status. Omit for every status.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe("How many to return, newest first. Defaults to 5."),
  }),
  async ({ email, status, limit = 5 }) =>
    digest(await findOrdersFor(email, status, limit + 1), email, limit),
);
