// NOT A LISTING FROM THE BOOK.
//
// The workshop diary chapter 6's `book_workshop_slot` calls. The slot ids it
// offers here are the ones that tool's schema says must have come back from a
// read earlier in the same run.
import { Hono } from "hono";
import { bookSlot, customerFromToken, offeredSlots } from "../store.js";

const workshop = new Hono();

workshop.get("/api/workshop/slots", async (c) => {
  const customerId = customerFromToken(c.req.header("authorization"));
  if (customerId === undefined) return c.json({ error: "no" }, 401);

  return c.json({ slots: await offeredSlots() });
});

workshop.post("/api/workshop/bookings", async (c) => {
  const customerId = customerFromToken(c.req.header("authorization"));
  if (customerId === undefined) return c.json({ error: "no" }, 401);

  const body = (await c.req.json()) as { slot_id?: string; job?: string };
  if (body.slot_id === undefined || body.job === undefined) {
    return c.json({ error: "slot_id and job required" }, 400);
  }

  const booked = await bookSlot(body.slot_id, customerId, body.job);
  // Taken between the offer and the booking. Chapter 6 reads this as an
  // outcome and not a fault.
  if (booked === "taken") return c.json({ error: "slot taken" }, 409);

  return c.json(booked, 201);
});

export { workshop };
