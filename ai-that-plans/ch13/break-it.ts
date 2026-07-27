// NOT A LISTING FROM THE BOOK.
//
// §"Break it on purpose": "Five experiments in `ch13/`, each producing one of
// this chapter's failures on demand." The chapter describes them as edits you
// make to the files in this directory. Making them here instead — one section
// per experiment, each building its own graph — means the correct code in this
// directory stays correct and all five can be run, in order, on a clean clone
// with no key and no network.
//
// Every section uses a MemorySaver, so this script writes nothing to
// ./ch13.sqlite and prints the same thing every time.
import {
  Command,
  END,
  InvalidUpdateError,
  MemorySaver,
  START,
  StateGraph,
  isInterrupted,
  type StateSnapshot,
} from "@langchain/langgraph";
import { fingerprint, pick } from "./fingerprint.js";
import { buildGraph } from "./graph.js";
import { findRepeat } from "./loop.js";
import { buildLoopingGraph } from "./looping-graph.js";
import { fixedPlan } from "./plan.js";
import { APPROVAL_PLAN, seedLoopingThread, SIX_STEPS } from "./seed.js";
import { PlanState, PROGRESS, type PlanUpdate, type State } from "./state.js";
import { pendingPause } from "./stalled.js";
import { buildSwallowingGraph } from "./swallowing-graph.js";
import { supplier } from "./tools.js";

function heading(n: number, text: string): void {
  const line = `${n}. ${text} `;
  console.log(`\n--- ${line}${"-".repeat(Math.max(0, 68 - line.length))}`);
}

function threadFor(threadId: string) {
  return { configurable: { thread_id: threadId } };
}

/** Oldest-first, which is the order every instrument in this chapter wants. */
async function historyOf(
  graph: { getStateHistory: (c: object) => AsyncIterableIterator<StateSnapshot> },
  threadId: string,
): Promise<StateSnapshot[]> {
  const snaps: StateSnapshot[] = [];
  for await (const snap of graph.getStateHistory(threadFor(threadId))) {
    snaps.push(snap);
  }
  return snaps.reverse();
}

function chain(snaps: StateSnapshot[], keys: readonly string[]): string {
  let previous = "";
  return snaps
    .map((snap) => {
      const mark = fingerprint(pick(snap.values, keys));
      const moved = mark === previous ? "=" : "+";
      previous = mark;
      return moved;
    })
    .join("");
}

// 1 --------------------------------------------------------------------------
heading(1, "move the attempts reset into execute");
console.log(
  "One line, moved from advance to where it reads better. `find_parts`\n" +
    "fails permanently, so the counter decide() bounds is cleared on the\n" +
    "very path it was meant to bound.",
);

const loopSaver = new MemorySaver();
await seedLoopingThread(loopSaver, "spin");
const spun = await historyOf(buildLoopingGraph(loopSaver), "spin");
const repeat = findRepeat(spun, PROGRESS);

console.log(`\nprogress column: ${chain(spun, PROGRESS)}`);
console.log(`next, last lap:  ${spun[spun.length - 1]?.next.join(",")}`);
console.log(
  repeat === undefined
    ? "findRepeat: nothing"
    : `findRepeat: cycle=${repeat.cycle.join(",")} laps=${repeat.laps} ` +
        `fromStep=${repeat.fromStep}`,
);
console.log("The fix is to move the line back.");

// 2 --------------------------------------------------------------------------
heading(2, "add messages to PROGRESS");
console.log(
  "Every lap appends a message, so the fingerprint changes every time and\n" +
    "a graph that is visibly looping reports clean.",
);

const WITH_EFFORT = [...PROGRESS, "messages"];
console.log(`\nPROGRESS              -> ${chain(spun, PROGRESS)}`);
console.log(`PROGRESS + messages   -> ${chain(spun, WITH_EFFORT)}`);
console.log(
  `findRepeat with messages in the list: ${
    findRepeat(spun, WITH_EFFORT) === undefined ? "undefined" : "found"
  }`,
);
console.log(
  "A progress list with an effort channel in it is a smoke alarm with the\n" +
    "battery out.",
);

// 3 --------------------------------------------------------------------------
heading(3, "catch the interrupt");
console.log(
  "interrupt() propagates by throwing, so a node that wraps its work in a\n" +
    "try/catch and logs whatever it caught will eat the pause.",
);

const swallowed = buildSwallowingGraph(
  new MemorySaver(),
  fixedPlan(APPROVAL_PLAN),
  false,
);
const beforeSwallowed = supplier.ordersPlaced;
const ranOn = await swallowed.invoke({}, threadFor("swallowed"));
console.log(`\nno guard: paused=${isInterrupted(ranOn)}`);
console.log(`no guard: completed=${(ranOn.completed ?? []).join(",")}`);
console.log(
  `no guard: orders placed = ${supplier.ordersPlaced - beforeSwallowed}`,
);

const guarded = buildSwallowingGraph(
  new MemorySaver(),
  fixedPlan(APPROVAL_PLAN),
  true,
);
const beforeGuarded = supplier.ordersPlaced;
const stoppedOn = await guarded.invoke({}, threadFor("guarded"));
console.log(`\nisGraphInterrupt rethrow: paused=${isInterrupted(stoppedOn)}`);
console.log(
  `isGraphInterrupt rethrow: orders placed = ` +
    `${supplier.ordersPlaced - beforeGuarded}`,
);
console.log(
  "This is not a stall; it is the opposite, and it is worse, because the\n" +
    "failure is a payment rather than a delay.",
);

// 4 --------------------------------------------------------------------------
heading(4, "resume with the wrong thread id");
console.log(
  "The approval screen builds its own config and uses job_4823 where the\n" +
    "runner used job-4823.",
);

const idSaver = new MemorySaver();
const idGraph = buildGraph(idSaver, fixedPlan(APPROVAL_PLAN));
await idGraph.invoke({}, threadFor("job-4823"));

try {
  await idGraph.invoke(new Command({ resume: "approve" }), threadFor("job_4823"));
  console.log("\njob_4823: invoke resolved, and nothing complained");
} catch (error) {
  console.log(`\njob_4823: ${(error as Error).message.split("\n")[0]}`);
}

const wrong = await historyOf(idGraph, "job_4823");
const right = await historyOf(idGraph, "job-4823");
console.log(`job_4823 (underscore): ${wrong.length} checkpoints`);
console.log(`job-4823 (hyphen):     ${right.length} checkpoints`);
const stillWaiting = pendingPause(
  await idGraph.getState(threadFor("job-4823")),
);
console.log(
  `the real pause is still there: ${
    stillWaiting === undefined ? "no" : `yes, at ${stillWaiting.node}`
  }`,
);
console.log(
  "Two threads are now in the database, and telling them apart without the\n" +
    "underscore in front of you is the argument for one config builder.",
);

// 5 --------------------------------------------------------------------------
heading(5, "return a string from a node");
console.log(
  "Same error class, two unrelated bugs, and the lc_error_code is what\n" +
    "separates them.",
);

/** TypeScript rejects this at compile time, which is the good news. The cast
 *  is here so the runtime failure can be shown beside the other one. */
const returnsAString = (() => "done") as unknown as (
  state: State,
) => PlanUpdate;

const stringy = new StateGraph(PlanState)
  .addNode("advance", returnsAString)
  .addEdge(START, "advance")
  .addEdge("advance", END)
  .compile();

try {
  await stringy.invoke({});
  console.log("\nno error, which would be the surprise");
} catch (error) {
  const bad = error as InvalidUpdateError;
  console.log(`\n${bad.lc_error_code}`);
  console.log(bad.message.split("\n")[0]);
}

const bothWrite = new StateGraph(PlanState)
  .addNode("left", (): PlanUpdate => ({ cursor: 1 }))
  .addNode("right", (): PlanUpdate => ({ cursor: 2 }))
  .addEdge(START, "left")
  .addEdge(START, "right")
  .addEdge("left", END)
  .addEdge("right", END)
  .compile();

try {
  await bothWrite.invoke({});
  console.log("no error, which would be the surprise");
} catch (error) {
  const bad = error as InvalidUpdateError;
  console.log(`\n${bad.lc_error_code}`);
  console.log(bad.message.split("\n")[0]);
}
