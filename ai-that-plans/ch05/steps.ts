// ch05/steps.ts
import { shop } from "./shop.js";
import type { Job, JobUpdate } from "./state.js";

const stepMs = Number(process.env.STEP_MS ?? 0);

/** Announce the step, honor CRASH_AT, then optionally slow down
 *  enough that a signal can arrive mid-run. */
async function enter(node: string): Promise<void> {
  if (process.env.CRASH_AT === node) {
    console.log(`${node}: killing the process`);
    process.exit(1);
  }
  console.log(node);
  if (stepMs > 0) await new Promise((r) => setTimeout(r, stepMs));
}

export async function lookupOrder(state: Job): Promise<JobUpdate> {
  await enter("lookup_order");
  const order = shop.orders.find((o) =>
    state.request.includes(o.model),
  );
  if (!order) throw new Error(`No order for: ${state.request}`);
  return { frameNumber: order.frameNumber, done: "lookup_order" };
}

export async function findParts(state: Job): Promise<JobUpdate> {
  await enter("find_parts");
  const part = shop.parts[state.frameNumber];
  if (!part) throw new Error(`No hub for ${state.frameNumber}`);
  return { partCode: part.code, done: "find_parts" };
}

// --- NOT PRINTED IN THE BOOK -----------------------------------------------
//
// The chapter prints two of the six nodes ("Two of them, and the switch that
// lets us break the process on cue") and names the other four in ch05/graph.ts,
// which imports all six from this file. They are written in the same shape as
// the two above: enter the step, read the fixture, return one field and the
// node's own name on `done`. No model call, no branch, nothing random — the
// experiment is "kill the process and see what survives", and that is only an
// experiment if the same input produces the same run every time.

export async function checkWarranty(state: Job): Promise<JobUpdate> {
  await enter("check_warranty");
  const order = shop.orders.find(
    (o) => o.frameNumber === state.frameNumber,
  );
  if (!order) throw new Error(`No cover for ${state.frameNumber}`);
  return { coverEndsOn: order.coverEndsOn, done: "check_warranty" };
}

/** The node that spends money. `shop.placeOrder` is idempotent per
 *  part and supplier, which is the defence the chapter argues for:
 *  a resumed run repeats the superstep that was in flight, so a node
 *  like this one has to be safe to run twice. */
export async function orderPart(state: Job): Promise<JobUpdate> {
  await enter("order_part");
  const part = shop.parts[state.frameNumber];
  if (!part) throw new Error(`No hub for ${state.frameNumber}`);
  const reference = await shop.placeOrder(
    state.partCode,
    part.supplier,
  );
  return { orderStatus: reference, done: "order_part" };
}

export async function bookSlot(state: Job): Promise<JobUpdate> {
  await enter("book_workshop_slot");
  const slot = await shop.bookSlot(state.frameNumber);
  return { slot, done: "book_workshop_slot" };
}

/** Drafts a message and never sends it, exactly as Book 3's tool did.
 *  There is no state field for a draft, so this node writes only its
 *  own name — which is enough to prove it ran. */
export async function notifyCustomer(): Promise<JobUpdate> {
  await enter("notify_customer");
  return { done: "notify_customer" };
}
