// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "The graph is chapter 5's six nodes in a straight line,
// carried over unchanged into `ch10/graph.ts`, and there is no model call
// anywhere in this chapter." These are those six nodes.
//
// One field is new since chapter 5 — `message` — because the chapter prints
// what the run said to the customer:
//
//     Your HUB-DX-135 is dispatched. We have you in on Tue 09:00.
//
// and both `ch10/patch.ts` and `ch10/fork.ts` end by printing it. So
// `notify_customer` writes the sentence into the state instead of only
// recording that it ran.
//
// The nodes are silent here, unlike chapter 5's. Chapter 5 printed a line per
// step because the experiment was killing the process mid-run; this chapter's
// experiments are all about what a checkpoint says afterwards, and a per-step
// log would drown the four-line outputs the chapter prints.
import { shop } from "./shop.js";
import type { Job, JobUpdate } from "./state.js";

export async function lookupOrder(state: Job): Promise<JobUpdate> {
  const order = shop.orders.find((o) => state.request.includes(o.model));
  if (!order) throw new Error(`No order for: ${state.request}`);
  return { frameNumber: order.frameNumber, done: "lookup_order" };
}

export async function checkWarranty(state: Job): Promise<JobUpdate> {
  const order = shop.orders.find((o) => o.frameNumber === state.frameNumber);
  if (!order) throw new Error(`No cover for ${state.frameNumber}`);
  return { coverEndsOn: order.coverEndsOn, done: "check_warranty" };
}

export async function findParts(state: Job): Promise<JobUpdate> {
  const part = shop.parts[state.frameNumber];
  if (!part) throw new Error(`No hub for ${state.frameNumber}`);
  return { partCode: part.code, done: "find_parts" };
}

/** The node that spends money, and the reason the chapter's closing warning
 *  is not theoretical: a fork past this step orders a second hub. */
export async function orderPart(state: Job): Promise<JobUpdate> {
  const part = shop.parts[state.frameNumber];
  if (!part) throw new Error(`No hub for ${state.frameNumber}`);
  const reference = await shop.placeOrder(state.partCode, part.supplier);
  return { orderStatus: reference, done: "order_part" };
}

export async function bookSlot(state: Job): Promise<JobUpdate> {
  const slot = await shop.bookSlot(state.frameNumber);
  return { slot, done: "book_workshop_slot" };
}

/** Drafts the message and never sends it. The sentence goes into the state
 *  because the chapter reads it back out of a resumed run. */
export async function notifyCustomer(state: Job): Promise<JobUpdate> {
  return {
    message: `Your ${state.partCode} is dispatched. We have you in on ${state.slot}.`,
    done: "notify_customer",
  };
}
