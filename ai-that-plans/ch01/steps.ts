// PRINTED IN CHAPTER 1 under "Where the plan comes from" — everything down to
// the end of `plan()` is the listing, byte for byte.
//
// The chapter then says of the rest of the file:
//
//   "`execute(step, state)` lives in the same file and dispatches to Book 3's
//    tools, passing the results so far so that `find_parts` can read the frame
//    number `lookup_order` found. It is Book 3's territory and it is not
//    reprinted here."
//
// So the second half of this file is not from the book. It is written to do
// exactly that sentence and nothing else, and it is fenced off below.
// ch01/steps.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const ORDER = [
  "lookup_order",
  "check_warranty",
  "find_parts",
  "order_part",
  "book_workshop_slot",
  "notify_customer",
] as const;

export async function plan(task: string): Promise<string[]> {
  const reply = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system:
      "Pick the steps this job needs, in order, from this list " +
      `and nothing else: ${ORDER.join(", ")}. One step per ` +
      "line, no other text.",
    messages: [{ role: "user", content: task }],
  });
  if (reply.stop_reason !== "end_turn") {
    throw new Error(`planner stopped on ${reply.stop_reason}`);
  }
  const known = new Set<string>(ORDER);
  return reply.content
    .flatMap((b) => (b.type === "text" ? b.text.split("\n") : []))
    .map((line) => line.trim())
    .filter((line) => known.has(line));
}

// --- NOT PRINTED IN THE BOOK -------------------------------------------------
//
// `execute(step, state)`, the half of this file the chapter hands to Book 3.
//
// The only interesting thing about it is the second argument. A step that needs
// a value an earlier step found has exactly one place to get it: `state.done`.
// Not a local variable, not a closure — after a crash, the file is all a second
// process has, so the results-so-far are the whole channel between steps. That
// is the sentence the chapter is making with "passing the results so far".
import { bookSlot, findHub, placeOrder, runTool } from "../shop/tools.js";
import type { RunState } from "./state.js";

// Also not printed: a pause per step, and one progress line. The shop fixture
// answers instantly, and the chapter's four experiments all require a human to
// interrupt a run in the middle of it ("Interrupt during step three"), which is
// not possible against a loop that finishes in nine milliseconds. Set
// PLANS_STEP_DELAY_MS=0 for an instant run — that is the setting for tests.
const STEP_DELAY_MS = Number(process.env.PLANS_STEP_DELAY_MS ?? 1200);

/** The result an earlier step wrote down, or undefined if it has not run. */
function resultOf(state: RunState, step: string): string | undefined {
  return state.done.find((entry) => entry.step === step)?.result;
}

/** The frame number `lookup_order` found: "ORD-4471, frame VER-8802, ..." */
function frameFrom(state: RunState): string {
  const frame = resultOf(state, "lookup_order")?.match(/frame ([^\s,]+)/)?.[1];
  if (frame === undefined) {
    throw new Error("no frame number on file: lookup_order has not run");
  }
  return frame;
}

/** The part `find_parts` chose: "HUB-VR-142 rear hub, Coldharbour Distribution, GBP 68.40" */
function partFrom(state: RunState): { code: string; supplier: string } {
  const fields = resultOf(state, "find_parts")?.split(", ");
  const code = fields?.[0]?.split(" ")[0];
  const supplier = fields?.[1];
  if (code === undefined || supplier === undefined) {
    throw new Error("no part on file: find_parts has not run");
  }
  return { code, supplier };
}

export async function execute(step: string, state: RunState): Promise<string> {
  console.log(`  ${state.done.length + 1}/${state.plan.length} ${step}`);
  if (STEP_DELAY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS));
  }
  switch (step) {
    case "find_parts": {
      const hub = await findHub(frameFrom(state));
      return `${hub.code} rear hub, ${hub.supplier}, GBP ${hub.priceGbp.toFixed(2)}`;
    }
    case "order_part": {
      // The money step, and the reason the chapter cares where the save lands.
      // `placeOrder` is idempotent per part+supplier, so a resumed run that
      // re-runs this step gets the same reference back rather than a second hub.
      const { code, supplier } = partFrom(state);
      return `ordered ${code}, reference ${await placeOrder(code, supplier)}`;
    }
    case "book_workshop_slot":
      return `next free bay: ${await bookSlot(frameFrom(state))}`;
    default:
      return runTool(step);
  }
}
