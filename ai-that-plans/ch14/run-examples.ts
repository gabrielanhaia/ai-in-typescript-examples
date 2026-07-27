// NOT A LISTING FROM THE BOOK.
//
// The chapter's checklist, for the rows that can be proved without a
// container, a key or a network — which is more of them than you would
// expect, because the three nodes that make the assembly work are the three
// that never call a model.
//
// This is the chapter default and what the test suite uses. The rows that
// need Postgres and a key are the server, and the README says how to run it.
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { advance, collect, execute } from "./nodes.js";
import { route } from "./route.js";
import { TOOLS } from "./shop.js";
import type { Job } from "./state.js";

/** The plan the planner returns for the warranty job, as a fixture,
 *  so this file is the same run on every machine. */
const PLAN = [...TOOLS];

function job(over: Partial<Job> = {}): Job {
  return {
    messages: [
      new HumanMessage("The rear hub on my Verano is grinding."),
    ],
    customerId: "cust-4417",
    steps: PLAN,
    cursor: 0,
    results: {},
    known: [],
    ...over,
  };
}

console.log("=== route: one decision, three named branches ===\n");
for (let cursor = 0; cursor <= PLAN.length; cursor += 1) {
  const at = PLAN[cursor] ?? "(past the end)";
  console.log(`cursor ${cursor}  ${at.padEnd(20)} ${route(job({ cursor }))}`);
}

console.log("\n=== execute: the four steps the parent owns ===\n");
let results: Record<string, string> = {};
for (const cursor of [0, 1]) {
  const update = await execute(job({ cursor, results }));
  // The channel's Update type is a union — a plain patch, or the
  // overwrite sentinel chapter 3 introduced. `execute` only ever
  // returns the first, and this is where that is said out loud.
  results = { ...results, ...(update.results as Record<string, string>) };
  console.log(`execute    ${PLAN[cursor]}: ${results[PLAN[cursor]]}`);
}

console.log("\n=== collect: one report, two steps recorded ===\n");
const report =
  "HUB-VR-142 from Coldharbour Distribution, GBP 68.40, " +
  "ordered as PO-1001.";
const collected = collect(
  job({
    cursor: 2,
    results,
    messages: [new AIMessage(report)],
  }),
);
console.log(Object.keys(collected.results ?? {}).join(", "), "<- one invoke");

console.log("\n=== advance: idempotent, so a resume lands where a fresh run would ===\n");
const settled = { ...results, ...collected.results };
const fresh = advance(job({ cursor: 0, results: settled }));
const resumed = advance(job({ cursor: 4, results: settled }));
console.log(`from cursor 0 -> ${fresh.cursor}`);
console.log(`from cursor 4 -> ${resumed.cursor}`);
console.log(
  fresh.cursor === resumed.cursor
    ? "same landing: four steps recorded, next is book_workshop_slot"
    : "DIVERGED — advance is not idempotent",
);
