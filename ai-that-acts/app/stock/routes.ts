// NOT A LISTING FROM THE BOOK.
//
// What `check_stock` reads. One part, one row, no filter language.
import { Hono } from "hono";
import { customerFromToken, stockFor } from "../store.js";

const stock = new Hono();

stock.get("/api/stock/:sku", async (c) => {
  const customerId = customerFromToken(c.req.header("authorization"));
  if (customerId === undefined) return c.json({ error: "no" }, 401);

  const part = await stockFor(c.req.param("sku"));
  if (part === undefined) return c.json({ error: "not found" }, 404);

  return c.json(part);
});

export { stock };
