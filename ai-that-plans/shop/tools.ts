// NOT A LISTING FROM THE BOOK.
//
// The Braxby Cycles tool surface, carried forward from Book 3 and unchanged by
// anything in Book 4. The book treats these as given — a node calls one, gets a
// line of text back — so they live here rather than being printed again.
//
// Two import forms appear in printed listings and BOTH have to resolve, because
// a printed import path is code a reader copies:
//
//     import { TOOLS, runTool } from "./shop.js";     // chNN/shop.ts re-exports
//     import * as shop from "../shop/tools.js";       // this file, directly
//
// Everything is a fixture on the reader's own machine. No example in this book
// can reach a real customer, a real payment, or a real inbox.
import { tool } from "langchain";
import { z } from "zod";

/** The order the whole book works from. Chapter 1 prints these literals. */
const ORDER = {
  id: "ORD-4471",
  frame: "VER-8802",
  purchased: "2025-11-03",
  coverEndsOn: "2027-11-03",
} as const;

/**
 * The part the warranty job turns out to need. The four fields are the four
 * the book prints: chapter 8's approval sentence is assembled from all of
 * them ("Order Verano rear hub, 142mm (HUB-VR-142) from Coldharbour
 * Distribution for GBP 68.40."), and chapter 8's `Part` schema requires
 * `name`, so it lives here rather than in the sentence that reads it.
 */
const HUB = {
  code: "HUB-VR-142",
  name: "Verano rear hub, 142mm",
  supplier: "Coldharbour Distribution",
  priceGbp: 68.4,
} as const;

/**
 * The six tools, in plan order. `as const` matters: chapters 4 and 6 write
 * `z.enum(TOOLS)` so the planner cannot invent a seventh step, and Zod needs
 * the literal tuple type to build that union.
 */
export const TOOLS = [
  "lookup_order",
  "check_warranty",
  "find_parts",
  "order_part",
  "book_workshop_slot",
  "notify_customer",
] as const;

export type Step = (typeof TOOLS)[number];

/** The same six names. Chapter 2 prints its own local copy of this. */
export const STEP_NAMES = TOOLS;

/** The two steps the parts specialist owns, in chapters 11 and 14. */
const PARTS_STEPS: readonly string[] = ["find_parts", "order_part"];

export function isPartsStep(step: string): boolean {
  return PARTS_STEPS.includes(step);
}

export async function findHub(frame: string): Promise<typeof HUB> {
  if (frame !== ORDER.frame) throw new Error(`no frame ${frame}`);
  return HUB;
}

/** Starts at 1000 so the first order of a process is PO-1001, which is the
 *  reference chapters 8 and 14 print. */
let orderSeq = 1000;

/** Idempotent per part+supplier, so a resumed run cannot order twice. */
const placed = new Map<string, string>();

/**
 * Test seam: chapter 8's gate test reads `supplier.ordersPlaced` on both
 * sides of an invoke and asserts it did not move, which is how it proves the
 * pause is IN FRONT OF the money rather than merely somewhere in the node.
 *
 * Bound to a second name here because `placeOrder`'s own parameter is called
 * `supplier` and would shadow it.
 */
const counter = { ordersPlaced: 0 };

export const supplier = counter;

export async function placeOrder(
  code: string,
  supplier: string,
): Promise<string> {
  const key = `${code}:${supplier}`;
  const existing = placed.get(key);
  if (existing !== undefined) return existing;
  const ref = `PO-${(++orderSeq).toString().padStart(4, "0")}`;
  placed.set(key, ref);
  counter.ordersPlaced += 1;
  return ref;
}

export async function bookSlot(frame: string): Promise<string> {
  if (frame !== ORDER.frame) throw new Error(`no frame ${frame}`);
  return "Thursday, 09:00";
}

const RESULTS: Record<Step, () => Promise<string>> = {
  lookup_order: async () =>
    `${ORDER.id}, frame ${ORDER.frame}, bought ${ORDER.purchased}`,
  check_warranty: async () =>
    `in cover to ${ORDER.coverEndsOn}, parts and labour`,
  find_parts: async () => {
    const hub = await findHub(ORDER.frame);
    return `${hub.code} rear hub, ${hub.supplier}, GBP ${hub.priceGbp.toFixed(2)}`;
  },
  // Spends money. Chapter 8 turns this line into a real pause.
  order_part: async () => "refused: a human decides this one",
  book_workshop_slot: async () => `next free bay: ${await bookSlot(ORDER.frame)}`,
  notify_customer: async () => "draft written, not sent",
};

/** One tool name in, one line of text out. Unknown names answer, never throw. */
export async function runTool(name: string): Promise<string> {
  const fn = RESULTS[name as Step];
  if (fn === undefined) return `unknown step: ${name}`;
  return fn();
}

/**
 * Chapter 4's variant. The second argument is the run's cursor, and it exists
 * so the chapter's retry route has something real to fail against: the supplier
 * lookup is arranged to fail the FIRST time it is attempted at a given cursor
 * and succeed on the retry, which is what a flaky upstream actually looks like.
 * Both arities are printed in the book, so `at` stays optional.
 *
 * Three call shapes are printed, not two. Chapter 4 passes the cursor as a
 * number; chapter 14's `execute` node passes the whole state — `runStep(step,
 * state)` — and reads the cursor off it. Widening the parameter here is what
 * lets both printed lines stand exactly as the page has them, and it costs
 * chapter 4 nothing: a number still means what it always meant.
 */
const attempted = new Set<number>();

export async function runStep(
  name: string,
  at?: number | { cursor: number },
): Promise<string> {
  const cursor = typeof at === "object" ? at.cursor : at;
  if (name === "find_parts" && cursor !== undefined && !attempted.has(cursor)) {
    attempted.add(cursor);
    throw new Error("supplier catalog timed out");
  }
  return runTool(name);
}

/** Test seam: chapter 4's retry example is not order-dependent across files. */
export function resetFlakiness(): void {
  attempted.clear();
}

// --- The same six, as tools a specialist agent can be given -----------------
// Chapters 11 and 14 pass these in arrays: tools: [shop.findParts, shop.orderPart]

export const lookupOrder = tool(async () => runTool("lookup_order"), {
  name: "lookup_order",
  description: "Find the purchase, its frame number and its purchase date.",
  schema: z.object({}),
});

export const checkWarranty = tool(async () => runTool("check_warranty"), {
  name: "check_warranty",
  description: "Say whether the bike is in cover, and for what.",
  schema: z.object({}),
});

export const findParts = tool(
  async ({ frame }) => JSON.stringify(await findHub(frame)),
  {
    name: "find_parts",
    description:
      "Find the hub that fits a frame. Returns the part code, the " +
      "supplier and the price.",
    schema: z.object({ frame: z.string() }),
  },
);

export const orderPart = tool(
  async ({ code, supplier }) => {
    const ref = await placeOrder(code, supplier);
    return `ordered ${code}, reference ${ref}`;
  },
  {
    name: "order_part",
    description: "Order a part from a supplier. Spends money.",
    schema: z.object({ code: z.string(), supplier: z.string() }),
  },
);

export const bookWorkshopSlot = tool(
  async ({ frame }) => bookSlot(frame),
  {
    name: "book_workshop_slot",
    description: "Take the next free bay in the workshop diary.",
    schema: z.object({ frame: z.string() }),
  },
);

export const notifyCustomer = tool(
  async ({ note }) => `draft written, not sent: ${note}`,
  {
    name: "notify_customer",
    description: "Draft a message to the customer. Never sends it.",
    schema: z.object({ note: z.string() }),
  },
);
