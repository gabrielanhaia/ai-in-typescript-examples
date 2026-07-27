// NOT A LISTING FROM THE BOOK.
//
// The second deliberately broken graph, and the chapter's third experiment:
//
//   "Catch the interrupt. Wrap `execute`'s body in `try`/`catch` and log the
//    error. The pause vanishes, the graph runs to completion, and the order is
//    placed with nobody's approval. Then add
//    `if (isGraphInterrupt(error)) throw error;` as the first line of the
//    `catch` and watch the pause come back."
//
// Both halves are here, because the point is the one line between them.
// `guarded: false` is the bug; `guarded: true` is the fix, and the shop's
// `ordersPlaced` counter says which one you ran.
//
// This is not a stall. It is the opposite of a stall, and it is worse: the
// failure is a payment rather than a delay.
import { StateGraph, START, END, interrupt, isGraphInterrupt } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { PlanState, type PlanUpdate, type State } from "./state.js";
import { decide } from "./route.js";
import { plan, type PlanNode } from "./plan.js";
import { advance, notify } from "./nodes.js";
import { proposalFor, runStep, type Proposal } from "./tools.js";

/** `nodes.ts`'s `execute` with a try/catch around the part that asks the
 *  human — the shape of every node somebody has made "robust". The catch logs
 *  and the node carries on, which is the whole failure: `runStep` below is
 *  where the shop's money actually moves. */
function executeCatching(guarded: boolean) {
  return async (state: State): Promise<PlanUpdate> => {
    const step = state.steps[state.cursor];

    try {
      const proposal = await proposalFor(step);
      if (proposal !== null) interrupt<Proposal, string>(proposal);
    } catch (error) {
      // The one line. Without it the pause is eaten and the money moves.
      if (guarded && isGraphInterrupt(error)) throw error;
      const name = error instanceof Error ? error.name : typeof error;
      console.log(`  [node caught ${name}, logged it, and carried on]`);
    }

    const result = await runStep(step, state.cursor);
    const attempts = state.attempts + 1;
    if (!result.ok) {
      return {
        attempts,
        lastError: result.error,
        messages: [new AIMessage(`${step}: ${result.error}`)],
      };
    }
    return {
      attempts,
      lastError: "",
      completed: step,
      messages: [new AIMessage(`${step}: ${result.output}`)],
    };
  };
}

export function buildSwallowingGraph(
  checkpointer: BaseCheckpointSaver,
  planner: PlanNode = plan,
  guarded = false,
) {
  return new StateGraph(PlanState)
    .addNode("plan", planner)
    .addNode("execute", executeCatching(guarded))
    .addNode("advance", advance)
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
