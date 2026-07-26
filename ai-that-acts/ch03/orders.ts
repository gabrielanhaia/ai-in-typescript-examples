// PRINTED IN CHAPTER 3 as `ch03/orders.ts` — the running app's own data
// layer, unchanged by this book. `issueRefund` below is the printed listing.
//
// The rows and `findOrder` are not printed. Up to chapter 5 the data is held
// here deliberately, so a failing example is never the network's doing;
// chapter 6 repoints the same tools at the service in `app/`.
import type { RefundInput } from "./schema.js";

export interface Order {
  readonly order_id: string;
  readonly status: string;
  readonly placed: string;
  readonly total_cents: number;
  readonly email: string;
}

const ORDERS: Order[] = [
  {
    order_id: "ORD-4471",
    status: "dispatched",
    placed: "2026-07-16",
    total_cents: 8900,
    email: "rowan.pike@example.com",
  },
  {
    order_id: "ORD-4472",
    status: "picking",
    placed: "2026-07-21",
    total_cents: 4250,
    email: "rowan.pike@example.com",
  },
  {
    order_id: "ORD-4310",
    status: "delivered",
    placed: "2026-05-02",
    total_cents: 12500,
    email: "rowan.pike@example.com",
  },
];

/** Throws a sentence rather than an error code, because the sentence is what
 *  the model reads. */
export async function findOrder(order_id: string): Promise<Order> {
  const order = ORDERS.find((row) => row.order_id === order_id);
  if (order === undefined) throw new Error(`No order ${order_id} exists.`);
  return order;
}

export async function findOrdersFor(
  email: string,
  status: string | undefined,
  limit: number,
): Promise<Order[]> {
  return ORDERS.filter(
    (order) =>
      order.email === email &&
      (status === undefined || order.status === status),
  ).slice(0, limit);
}

export async function issueRefund(input: RefundInput): Promise<string> {
  const order = await findOrder(input.order_id);
  if (input.amount_cents > order.total_cents) {
    throw new Error(
      `Refund of ${input.amount_cents} exceeds the order total of ` +
        `${order.total_cents} cents.`,
    );
  }
  const { order_id } = order;
  return `Refunded ${input.amount_cents} cents against ${order_id}.`;
}
