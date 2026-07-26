// PRINTED IN CHAPTER 6 as `ch06/summarise.ts`.
//
// Named fields only. When the service grows a column later, a schema written
// this way drops it; one written as a set of exclusions would pass it along.
import { z } from "zod";
import { money } from "../app/money.js";

const Order = z.object({
  order_id: z.string(),
  status: z.string(),
  placed: z.string(),
  total_cents: z.number(),
  lines: z.array(z.object({ sku: z.string(), name: z.string() })),
});

export function summarise(body: unknown): string {
  const order = Order.parse(body);
  const items = order.lines.map((l) => `${l.name} (${l.sku})`).join(", ");

  return (
    `Order ${order.order_id}, placed ${order.placed}, currently ` +
    `${order.status}. Total ${money.format(order.total_cents / 100)}. ` +
    `Items: ${items}.`
  );
}
