// ch06/ownership.ts
import { pool } from "./checkpointer.js";

const db = pool();

/** Called once, when a thread id is minted. */
export async function claimThread(customer: string, thread: string) {
  await db.query(
    `INSERT INTO braxby.thread_owner (thread_id, customer_id)
     VALUES ($1, $2) ON CONFLICT (thread_id) DO NOTHING`,
    [thread, customer],
  );
}

export async function threadsOwnedBy(customer: string) {
  const { rows } = await db.query<{ thread_id: string }>(
    `SELECT thread_id FROM braxby.thread_owner
      WHERE customer_id = $1`,
    [customer],
  );
  return rows.map((r) => r.thread_id);
}

export async function forgetOwnership(customer: string) {
  await db.query(
    `DELETE FROM braxby.thread_owner WHERE customer_id = $1`,
    [customer],
  );
}
