// NOT A LISTING FROM THE BOOK.
//
// The two jobs the chapter debugs, written to ./ch13.sqlite so that the
// printed commands have something to read:
//
//   npm run run-example -- ch13/inspect job-4818
//   npm run run-example -- ch13/inspect job-4823
//
// Every diagnostic in this chapter reads a run that has already gone wrong, so
// the runs have to exist first. Nothing here calls a model: the plan is
// `fixedPlan([…])`, which is what a replayed incident is — the plan is already
// decided and written down.
//
// The two plans are the ones the printed traces imply, read off the step
// numbers in the chapter's own output:
//
//   job-4818 pauses nowhere and first fails at superstep 6, with the cursor on
//   index 2 — `find_parts` in the six-step plan, which is exactly the step the
//   chapter makes fail permanently.
//
//   job-4823 pauses at superstep 6 with the cursor on index 2, and the pause
//   is the money step, so index 2 of ITS plan is `order_part`.
import { rmSync } from "node:fs";
import { HumanMessage } from "@langchain/core/messages";
import { GraphRecursionError } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { SQLITE_FILE } from "./checkpointer.js";
import { buildGraph } from "./graph.js";
import { buildLoopingGraph } from "./looping-graph.js";
import { fixedPlan } from "./plan.js";
import { alwaysFail, resetFlakiness, TOOLS } from "./tools.js";

export const JOB_LOOPING = "job-4818";
export const JOB_STALLED = "job-4823";
export const JOB_BUDGET = "job-4830";

const REQUEST = "rear hub grinding on ORD-4471, still in warranty";

/** The six-step plan. `steps[2]` is `find_parts`. */
export const SIX_STEPS: readonly string[] = TOOLS;

/** The plan that reaches the money. `steps[2]` is `order_part`. */
export const APPROVAL_PLAN: readonly string[] = [
  "lookup_order",
  "check_warranty",
  "order_part",
  "book_workshop_slot",
  "notify_customer",
];

function threadFor(threadId: string) {
  return { configurable: { thread_id: threadId } };
}

function input() {
  return { messages: [new HumanMessage(REQUEST)] };
}

/** Delete the store, including SQLite's two WAL sidecars, so a second run of
 *  the examples prints what the first one did. */
export function resetStore(): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${SQLITE_FILE}${suffix}`, { force: true });
  }
}

/**
 * Job 4818: the graph that spins. `find_parts` fails permanently, and the
 * counter `decide` bounds is reset on the retry path, so `MAX_ATTEMPTS` is
 * never reached and the recursion limit ends the run.
 *
 * Returns nothing useful — the evidence is the thread, which is the point of
 * the chapter.
 */
export async function seedLoopingThread(
  checkpointer: BaseCheckpointSaver,
  threadId = JOB_LOOPING,
  recursionLimit = 25,
): Promise<void> {
  alwaysFail("find_parts");
  try {
    const graph = buildLoopingGraph(checkpointer, fixedPlan(SIX_STEPS));
    await graph.invoke(input(), { ...threadFor(threadId), recursionLimit });
  } catch (error) {
    if (!(error instanceof GraphRecursionError)) throw error;
  } finally {
    alwaysFail(null);
    resetFlakiness();
  }
}

/**
 * Job 4823: the graph that waits. Nothing here is broken. The graph was asked
 * to pause before it spent the shop's money, it paused, it wrote the pause to
 * disk, and it stopped. What failed is everything downstream: the answer never
 * came back.
 */
export async function seedStalledThread(
  checkpointer: BaseCheckpointSaver,
  threadId = JOB_STALLED,
): Promise<void> {
  const graph = buildGraph(checkpointer, fixedPlan(APPROVAL_PLAN));
  await graph.invoke(input(), threadFor(threadId));
}

/**
 * The ceiling the recursion limit is not. One `thread_id`, invoked again and
 * again the way a queue retrying a failed message would, each invocation
 * getting a completely fresh allowance of supersteps.
 *
 * Returns how many invocations it took to spend `until` supersteps on one
 * thread — which is the number nothing in LangGraph is counting.
 */
export async function spinUntilSpent(
  checkpointer: BaseCheckpointSaver,
  until: number,
  threadId = JOB_BUDGET,
  recursionLimit = 25,
): Promise<{ invocations: number; spent: number }> {
  const graph = buildLoopingGraph(checkpointer, fixedPlan(SIX_STEPS));
  let invocations = 0;
  let spent = -1;

  alwaysFail("find_parts");
  try {
    while (spent < until && invocations < 10) {
      invocations += 1;
      try {
        await graph.invoke(input(), { ...threadFor(threadId), recursionLimit });
      } catch (error) {
        if (!(error instanceof GraphRecursionError)) throw error;
      }
      spent = (await graph.getState(threadFor(threadId))).metadata?.step ?? -1;
    }
  } finally {
    alwaysFail(null);
    resetFlakiness();
  }

  return { invocations, spent };
}
