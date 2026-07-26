import { Hono } from "hono";
import { findOrdersFor, customerFromToken, loadOrder } from "../store.js";

const orders = new Hono();

// ---------------------------------------------------------------------------
// PRINTED IN CHAPTER 6, verbatim, as `app/orders/routes.ts`.
// ---------------------------------------------------------------------------
orders.get("/api/orders/:id", async (c) => {
  const customerId = customerFromToken(c.req.header("authorization"));
  if (customerId === undefined) return c.json({ error: "no" }, 401);

  // Scoped in the query, not filtered out of the answer afterwards.
  const order = await loadOrder(c.req.param("id"), customerId);
  if (order === undefined) return c.json({ error: "not found" }, 404);

  return c.json(order);
});

// ---------------------------------------------------------------------------
// NOT PRINTED. The two endpoints chapter 5's `find_orders` and
// `get_order_items` need, written the same way: the customer goes into the
// query, and an order that belongs to somebody else is a 404 rather than a
// 403, so the answer cannot be used to confirm that a number is real.
// ---------------------------------------------------------------------------
orders.get("/api/orders", async (c) => {
  const customerId = customerFromToken(c.req.header("authorization"));
  if (customerId === undefined) return c.json({ error: "no" }, 401);

  const email = c.req.query("email");
  if (email === undefined) return c.json({ error: "email required" }, 400);

  const limit = Math.min(Number(c.req.query("limit") ?? 6), 21);
  const found = await findOrdersFor(
    email,
    customerId,
    c.req.query("status"),
    limit,
  );

  return c.json({ orders: found });
});

orders.get("/api/orders/:id/items", async (c) => {
  const customerId = customerFromToken(c.req.header("authorization"));
  if (customerId === undefined) return c.json({ error: "no" }, 401);

  const order = await loadOrder(c.req.param("id"), customerId);
  if (order === undefined) return c.json({ error: "not found" }, 404);

  return c.json({ order_id: order.order_id, lines: order.lines });
});

export { orders };
