// PRINTED IN CHAPTER 6 as `ch06/toolbox.ts` — the `get_order_status` tool,
// verbatim, including the 404 branch and the throw.
//
// NOT PRINTED: the other five. Chapter 5's table settles the surface at six
// tools and names each one's job, and chapter 12 says the surface goes from
// six to seven, so all six have to exist for the book's own claims to hold.
// They are written in the shape of the printed one: the context arrives by
// closure, a result the model can act on comes back as prose, and anything
// that is a fault throws for chapter 7 to classify.
//
// `issue_refund` calls chapter 7's `postRefund`, because the idempotency key
// is chapter 7's subject and chapter 6 says so explicitly.
import { z } from "zod";
import { defineTool, type RegisteredTool } from "../ch03/define-tool.js";
import { digest } from "../ch05/digest.js";
import { refundTool } from "../ch07/refund.js";
import { apiGet } from "./api.js";
import { bookSlot } from "./book-slot.js";
import type { ToolContext } from "./context.js";
import { summarise } from "./summarise.js";

const OrderRows = z.object({
  orders: z.array(
    z.object({
      order_id: z.string(),
      status: z.string(),
      placed: z.string(),
      total_cents: z.number(),
    }),
  ),
});

const Items = z.object({
  order_id: z.string(),
  lines: z.array(
    z.object({
      sku: z.string(),
      name: z.string(),
      qty: z.number(),
      workshop_built: z.boolean(),
    }),
  ),
});

const Part = z.object({
  sku: z.string(),
  name: z.string(),
  on_hand: z.number(),
  restock: z.string().nullable(),
});

export function toolboxFor(
  ctx: ToolContext,
  runId = "r_local",
): RegisteredTool[] {
  return [
    defineTool(
      "get_order_status",
      "Look up one Braxby Cycles order by its order number. Returns " +
        "the status, the date it was placed and the order total.",
      z.object({
        order_id: z.string().describe("The order number, like ORD-4471."),
      }),
      async ({ order_id }) => {
        const outcome = await apiGet(`/api/orders/${order_id}`, ctx);

        if (!outcome.ok && outcome.status === 404) {
          return (
            `There is no order ${order_id} on this account. Ask the ` +
            `customer to re-read the number from their confirmation ` +
            `email, or call find_orders with their email address.`
          );
        }

        if (!outcome.ok) {
          throw new Error(
            `orders api ${outcome.status}: ${outcome.detail}`,
          );
        }

        return summarise(outcome.body);
      },
    ),

    defineTool(
      "find_orders",
      "Find a customer's recent orders from their email address. " +
        "Returns one line per order: order number, date, status and " +
        "total. It does not return the items on an order — call " +
        "get_order_items with an order number for that. If the customer " +
        "has already given you an order number, use get_order_status " +
        "directly instead of searching.",
      z.object({
        email: z
          .string()
          .describe("Email address the order was placed with."),
        status: z
          .enum(["paid", "picking", "packed", "dispatched", "delivered"])
          .optional()
          .describe("Only orders in this status. Omit for every status."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("How many to return, newest first. Defaults to 5."),
      }),
      async ({ email, status, limit = 5 }) => {
        const query = new URLSearchParams({
          email,
          limit: String(limit + 1),
        });
        if (status !== undefined) query.set("status", status);

        const outcome = await apiGet(`/api/orders?${query}`, ctx);
        if (!outcome.ok) {
          throw new Error(`orders api ${outcome.status}: ${outcome.detail}`);
        }

        const { orders } = OrderRows.parse(outcome.body);
        return digest(
          orders.map((order) => ({ ...order, email })),
          email,
          limit,
        );
      },
    ),

    defineTool(
      "get_order_items",
      "List what was on one order: part number, name, quantity, and " +
        "whether the Braxby workshop built it rather than supplying it " +
        "boxed. Use this when the answer turns on what the customer " +
        "actually bought; get_order_status is enough for where it is.",
      z.object({
        order_id: z.string().describe("The order number, like ORD-4471."),
      }),
      async ({ order_id }) => {
        const outcome = await apiGet(`/api/orders/${order_id}/items`, ctx);

        if (!outcome.ok && outcome.status === 404) {
          return (
            `There is no order ${order_id} on this account, so there is ` +
            `nothing to list. Ask the customer to re-read the number.`
          );
        }
        if (!outcome.ok) {
          throw new Error(`orders api ${outcome.status}: ${outcome.detail}`);
        }

        const { order_id: id, lines } = Items.parse(outcome.body);
        const rows = lines.map(
          (line) =>
            `${line.name} (${line.sku}) x${line.qty}` +
            `${line.workshop_built ? ", built by the Braxby workshop" : ""}`,
        );
        return `Order ${id} contains:\n${rows.join("\n")}`;
      },
    ),

    defineTool(
      "check_stock",
      "Check how many of one part are on the shelf, by part number, and " +
        "when the next delivery is due if there are none. Use it before " +
        "offering to send a replacement.",
      z.object({
        sku: z.string().describe("The part number, like BRK-1180."),
      }),
      async ({ sku }) => {
        const outcome = await apiGet(`/api/stock/${sku}`, ctx);

        if (!outcome.ok && outcome.status === 404) {
          return (
            `${sku} is not a part number we stock. Check it against the ` +
            `line on the order with get_order_items.`
          );
        }
        if (!outcome.ok) {
          throw new Error(`stock api ${outcome.status}: ${outcome.detail}`);
        }

        const part = Part.parse(outcome.body);
        if (part.on_hand > 0) {
          return `${part.name} (${part.sku}): ${part.on_hand} on the shelf.`;
        }
        return (
          `${part.name} (${part.sku}): none on the shelf. ` +
          `${part.restock === null
            ? "No delivery date is booked."
            : `The next delivery is due ${part.restock}.`}`
        );
      },
    ),

    bookSlot(ctx, runId),
    refundTool(ctx),
  ];
}
