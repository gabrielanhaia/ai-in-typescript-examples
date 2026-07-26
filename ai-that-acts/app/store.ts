// NOT A LISTING FROM THE BOOK, except where marked.
//
// The queries the printed route handlers call. `loadOrder` and `findByKey`
// are named in chapter 6's and chapter 7's listings; everything else here is
// the rest of the sample service.
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { seed } from "./seed.js";

export interface OrderRow {
  order_id: string;
  status: string;
  placed: string;
  delivered: string | null;
  total_cents: number;
  carrier: string | null;
  tracking: string | null;
  lines: { sku: string; name: string; qty: number; workshop_built: boolean }[];
}

/** Who the caller is. A real one would verify a signature and read a subject
 *  out of it; this one accepts any bearer token and answers as the shop's one
 *  demo customer, so that no listing in the book needs a credential the
 *  reader has to go and mint. A missing header is still a 401, which is the
 *  branch chapter 6's handler prints. */
export function customerFromToken(
  header: string | undefined,
): string | undefined {
  if (header === undefined) return undefined;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token === "" ? undefined : "cust_4471";
}

function linesFor(orderId: string): OrderRow["lines"] {
  const rows = db()
    .prepare(
      "SELECT sku, name, qty, workshop_built FROM order_lines" +
        " WHERE order_id = ? ORDER BY sku",
    )
    .all(orderId) as { sku: string; name: string; qty: number;
      workshop_built: number }[];

  return rows.map((row) => ({
    sku: row.sku,
    name: row.name,
    qty: row.qty,
    workshop_built: row.workshop_built === 1,
  }));
}

export async function loadOrder(
  id: string,
  customerId: string,
): Promise<OrderRow | undefined> {
  seed();
  const row = db()
    .prepare(
      "SELECT order_id, status, placed, delivered, total_cents, carrier," +
        " tracking FROM orders WHERE order_id = ? AND customer_id = ?",
    )
    .get(id, customerId) as Omit<OrderRow, "lines"> | undefined;

  if (row === undefined) return undefined;
  return { ...row, lines: linesFor(row.order_id) };
}

export async function findOrdersFor(
  email: string,
  customerId: string,
  status: string | undefined,
  limit: number,
): Promise<Omit<OrderRow, "lines">[]> {
  seed();
  const sql =
    "SELECT order_id, status, placed, delivered, total_cents, carrier," +
    " tracking FROM orders WHERE email = ? AND customer_id = ?" +
    (status === undefined ? "" : " AND status = ?") +
    " ORDER BY placed DESC LIMIT ?";

  const args =
    status === undefined
      ? [email, customerId, limit]
      : [email, customerId, status, limit];

  return db().prepare(sql).all(...args) as Omit<OrderRow, "lines">[];
}

export async function stockFor(
  sku: string,
): Promise<{ sku: string; name: string; on_hand: number;
  restock: string | null } | undefined> {
  seed();
  return db()
    .prepare("SELECT sku, name, on_hand, restock FROM stock WHERE sku = ?")
    .get(sku) as { sku: string; name: string; on_hand: number;
      restock: string | null } | undefined;
}

/** Backed by the unique constraint on the column rather than by anything
 *  held in memory. Answers with the refund this key produced, if there was
 *  one. */
export async function findByKey(key: string): Promise<string | undefined> {
  seed();
  const row = db()
    .prepare("SELECT refund_id FROM refunds WHERE idempotency_key = ?")
    .get(key) as { refund_id: string } | undefined;
  return row?.refund_id;
}

export async function insertRefund(
  key: string,
  body: unknown,
): Promise<string> {
  seed();
  const input = body as {
    order_id?: string;
    amount_cents?: number;
    reason?: string;
    note?: string;
  };
  const refund_id = `RF-${randomUUID().slice(0, 5).toUpperCase()}`;

  // The insert and the key go in together, or two concurrent calls both find
  // nothing and both insert. The unique index is what makes the second one
  // fail rather than duplicate.
  db()
    .prepare(
      "INSERT INTO refunds (refund_id, idempotency_key, order_id," +
        " amount_cents, reason, note, at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(refund_id, key, input.order_id ?? "", input.amount_cents ?? 0,
      input.reason ?? "", input.note ?? null, new Date().toISOString());

  return refund_id;
}

export async function offeredSlots(): Promise<
  { slot_id: string; starts: string }[]
> {
  seed();
  return db()
    .prepare(
      "SELECT slot_id, starts FROM workshop_slots WHERE taken = 0" +
        " ORDER BY starts",
    )
    .all() as { slot_id: string; starts: string }[];
}

export async function bookSlot(
  slotId: string,
  customerId: string,
  job: string,
): Promise<{ reference: string; starts: string } | "taken"> {
  seed();
  const slot = db()
    .prepare("SELECT slot_id, starts, taken FROM workshop_slots" +
      " WHERE slot_id = ?")
    .get(slotId) as { slot_id: string; starts: string; taken: number } |
      undefined;

  if (slot === undefined || slot.taken === 1) return "taken";

  const reference = `WS-${Math.floor(2300 + Math.random() * 90)}`;
  db()
    .prepare(
      "INSERT INTO workshop_bookings (reference, slot_id, customer_id, job," +
        " status, booked_for, waiting_days, part)" +
        " VALUES (?, ?, ?, ?, 'booked', ?, 0, '')",
    )
    .run(reference, slotId, customerId, job, slot.starts);
  db().prepare("UPDATE workshop_slots SET taken = 1 WHERE slot_id = ?")
    .run(slotId);

  return { reference, starts: slot.starts };
}
