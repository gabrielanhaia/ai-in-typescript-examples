// NOT A LISTING FROM THE BOOK.
//
// The chapter default, and the whole of chapter 13 with no key, no network and
// no container. It writes the two jobs the chapter debugs into ./ch13.sqlite
// and then reads them back with the chapter's own instruments, in the order
// the chapter builds them:
//
//   1. the chain, four columns                §"Reading the chain"
//   2. findRepeat: which loop, and from where §"The three causes"
//   3. the ceiling the recursion limit is not §"The ceiling the recursion
//                                               limit is not"
//   4. pendingPause: the thread that waits    §"Signature two"
//   5. the compiled graph, drawn              §"Draw the graph you actually
//                                               compiled"
//
// Run this first: `ch13/inspect`, `ch13/answer` and `ch13/draw` all read the
// store this leaves behind.
import type { StateSnapshot } from "@langchain/langgraph";
import { openCheckpointer } from "./checkpointer.js";
import { fingerprint, pick } from "./fingerprint.js";
import { buildGraph } from "./graph.js";
import { findRepeat } from "./loop.js";
import { PROGRESS } from "./state.js";
import { pendingPause } from "./stalled.js";
import { MAX_THREAD_STEPS, runOnce } from "./thread-budget.js";
import {
  APPROVAL_PLAN,
  JOB_BUDGET,
  JOB_LOOPING,
  JOB_STALLED,
  resetStore,
  seedLoopingThread,
  seedStalledThread,
  SIX_STEPS,
  spinUntilSpent,
} from "./seed.js";

function heading(text: string): void {
  console.log(`\n--- ${text} ${"-".repeat(Math.max(0, 68 - text.length))}`);
}

// Before anything opens the file: SQLite will not survive having its database
// deleted out from under an open handle.
resetStore();

const checkpointer = openCheckpointer();
const graph = buildGraph(checkpointer);

function threadFor(threadId: string) {
  return { configurable: { thread_id: threadId } };
}

/** History comes back newest-first; a run reads forwards. */
async function historyOf(threadId: string): Promise<StateSnapshot[]> {
  const snaps: StateSnapshot[] = [];
  for await (const snap of graph.getStateHistory(threadFor(threadId))) {
    snaps.push(snap);
  }
  return snaps.reverse();
}

/** The four columns ch13/inspect.ts prints, without the argv around them. */
function printChain(snaps: StateSnapshot[], cap = 10): void {
  let previous = "";
  snaps.forEach((snap, index) => {
    const mark = fingerprint(pick(snap.values, PROGRESS));
    const moved = mark === previous ? "=" : "+";
    previous = mark;
    if (index >= cap) return;
    const step = String(snap.metadata?.step ?? "?").padStart(3);
    const next = (snap.next.join(",") || "-").padEnd(12);
    const paused = snap.tasks.some((t) => t.interrupts.length > 0);
    const failed = snap.tasks.some((t) => t.error !== undefined);
    const flag = paused ? " PAUSED" : failed ? " ERROR" : "";
    console.log(`${step} ${moved} ${next}${flag}`);
  });
  if (snaps.length > cap) {
    console.log(`  … and ${snaps.length - cap} more, all of them "=".`);
  }
}

// ---------------------------------------------------------------------------
await seedLoopingThread(checkpointer);
await seedStalledThread(checkpointer);

// 1 --------------------------------------------------------------------------
heading("job 4818: the graph that spins");
console.log(`plan: ${SIX_STEPS.join(", ")}`);
const looping = await historyOf(JOB_LOOPING);
printChain(looping);

// 2 --------------------------------------------------------------------------
heading("findRepeat: which loop, and from where");
const repeat = findRepeat(looping, PROGRESS);
console.log(
  repeat === undefined
    ? "no repeat found"
    : `cycle=${repeat.cycle.join(",")} laps=${repeat.laps} ` +
        `fromStep=${repeat.fromStep}`,
);
console.log(
  "The exception told you a loop happened. The cycle tells you which one.",
);

// 3 --------------------------------------------------------------------------
heading("the ceiling the recursion limit is not");
const spun = await spinUntilSpent(checkpointer, MAX_THREAD_STEPS);
console.log(
  `${JOB_BUDGET}: ${spun.invocations} invocations, each with a fresh ` +
    `allowance of 25 supersteps`,
);
console.log(`metadata.step on the newest checkpoint: ${spun.spent}`);

const refused = await runOnce(JOB_BUDGET, {}, 25);
console.log(
  `runOnce -> ok=${refused.ok}` +
    (refused.ok ? "" : ` reason=${refused.reason} spent=${refused.spent}`) +
    ` (MAX_THREAD_STEPS=${MAX_THREAD_STEPS})`,
);

// 4 --------------------------------------------------------------------------
heading("job 4823: the graph that waits");
console.log(`plan: ${APPROVAL_PLAN.join(", ")}`);
const stalled = await historyOf(JOB_STALLED);
printChain(stalled);

const pause = pendingPause(await graph.getState(threadFor(JOB_STALLED)));
if (pause === undefined) {
  console.log("no pause on this thread, which would be the bug");
} else {
  console.log(`\n${pause.node} asked: ${JSON.stringify(pause.value)}`);
  console.log(
    `waiting ${Math.floor((pause.waitingMs ?? 0) / 1000)} s ` +
      "(a real sweep sorts every open thread by this)",
  );
}

console.log(
  `\nfindRepeat on the stalled thread: ${
    findRepeat(stalled, PROGRESS) === undefined ? "undefined" : "found"
  } — a stall is one link, not a shape.`,
);

// 5 --------------------------------------------------------------------------
heading("the graph you actually compiled");
const mermaid = (await graph.getGraphAsync({})).drawMermaid();
console.log(
  mermaid
    .split("\n")
    .filter((line) => line.includes("-->") || line.includes(".->"))
    .map((line) => line.trim())
    .join("\n"),
);

let subgraphs = 0;
for await (const _ of graph.getSubgraphsAsync()) subgraphs += 1;
console.log(
  `\n${subgraphs} subgraphs — this chapter's graph is flat, and printing ` +
    "nothing here\nwhen you expected a specialist is the fastest way to find " +
    "the one you\nnever nested.",
);
