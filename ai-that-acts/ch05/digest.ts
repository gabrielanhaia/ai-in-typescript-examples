// PRINTED IN CHAPTER 5 as `ch05/digest.ts`, and again in chapter 6 as
// `ch05/digest.ts (continued)`. Both blocks are below, in file order; the
// lines between them are not printed.
import type { Order } from "../ch03/orders.js";
import { money } from "../app/money.js";

export function digest(
  found: Order[],
  email: string,
  limit: number,
): string {
  if (found.length === 0) {
    return (
      `No orders for ${email}. The address may be spelled differently ` +
      `on the order itself; ask the customer to check the address on ` +
      `their confirmation email.`
    );
  }

  const lines = found
    .slice(0, limit)
    .map(
      (order) =>
        `${order.order_id}  ${order.placed}  ${order.status}  ` +
        `${money.format(order.total_cents / 100)}`,
    );

  // The caller fetched limit + 1 rows. The extra one is never shown; it only
  // answers whether anything was left behind, so nothing here invites paging.
  if (found.length <= limit) return lines.join("\n");

  return [
    ...lines,
    `More orders exist. Narrow the search with a status rather than ` +
      `paging through them.`,
  ].join("\n");
}
