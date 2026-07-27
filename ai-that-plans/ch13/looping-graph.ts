// NOT A LISTING FROM THE BOOK.
//
// Job 4818, on demand. This is `graph.ts` with the chapter's most common loop
// cause in it and nothing else changed:
//
//   "Chapter 4 put `attempts: 0` in `advance` precisely so the retry route
//    could not reach it. Move that reset into `execute` — which somebody will,
//    because it reads better there — and the counter is now cleared on the
//    very path it was meant to bound. `MAX_ATTEMPTS` is never reached, and the
//    graph retries a step that will never succeed until the limit ends the
//    run."
//
// It lives in its own file rather than as a commented-out line in `nodes.ts`
// so that the correct graph in this directory stays correct and the broken one
// can be run, diffed and read side by side. The two functions below are the
// only difference from `nodes.ts`: `advance` no longer resets the counter and
// `execute` does.
import { StateGraph, START, END, interrupt } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { PlanState, type PlanUpdate, type State } from "./state.js";
import { decide, MAX_ATTEMPTS } from "./route.js";
import { plan, type PlanNode } from "./plan.js";
import { notify } from "./nodes.js";
import { proposalFor, runStep, type Proposal } from "./tools.js";

/** The bug. The reset reads better here — "a fresh count for a fresh
 *  execution" — and `execute` is the node the retry edge points back at, so
 *  the counter `decide` bounds is cleared on the path it was meant to bound. */
export async function executeResettingAttempts(
  state: State,
): Promise<PlanUpdate> {
  const step = state.steps[state.cursor];

  const proposal = await proposalFor(step);
  if (proposal !== null) {
    const answer = interrupt<Proposal, string>(proposal);
    if (answer !== "approve") {
      return {
        attempts: MAX_ATTEMPTS,
        lastError: `${step}: declined (${answer})`,
        messages: [new AIMessage(`${step} declined: ${answer}`)],
      };
    }
  }

  const result = await runStep(step, state.cursor);
  // The moved line. Chapter 4 had `state.attempts + 1` here.
  const attempts = 1;
  if (!result.ok) {
    return {
      attempts,
      lastError: result.error,
      messages: [new AIMessage(`${step} attempt ${attempts}: ${result.error}`)],
    };
  }
  return {
    attempts,
    lastError: "",
    completed: step,
    messages: [new AIMessage(`${step}: ${result.output}`)],
  };
}

/** The other half of the same edit: the reset is gone from here. */
export function advanceKeepingAttempts(state: State): PlanUpdate {
  return { cursor: state.cursor + 1 };
}

export function buildLoopingGraph(
  checkpointer: BaseCheckpointSaver,
  planner: PlanNode = plan,
) {
  return new StateGraph(PlanState)
    .addNode("plan", planner)
    .addNode("execute", executeResettingAttempts)
    .addNode("advance", advanceKeepingAttempts)
    .addNode("notify", notify)
    .addEdge(START, "plan")
    .addEdge("plan", "execute")
    .addConditionalEdges("execute", decide, {
      retry: "execute",
      continue: "advance",
      finish: "notify",
    })
    .addEdge("advance", "execute")
    .addEdge("notify", END)
    .compile({ checkpointer });
}
