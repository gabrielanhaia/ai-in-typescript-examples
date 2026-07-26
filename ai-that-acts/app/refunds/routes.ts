import { Hono } from "hono";
import { findByKey, insertRefund } from "../store.js";

const refunds = new Hono();

// ---------------------------------------------------------------------------
// PRINTED IN CHAPTER 7, verbatim, as `app/refunds/routes.ts`.
// ---------------------------------------------------------------------------
refunds.post("/api/refunds", async (c) => {
  const key = c.req.header("idempotency-key");
  if (key === undefined) {
    return c.json({ error: "idempotency-key required" }, 400);
  }

  const already = await findByKey(key);
  if (already !== undefined) {
    return c.json({ refund_id: already, repeat: true });
  }

  const refund_id = await insertRefund(key, await c.req.json());
  return c.json({ refund_id, repeat: false }, 201);
});

export { refunds };
