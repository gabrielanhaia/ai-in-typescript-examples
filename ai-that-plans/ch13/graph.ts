// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "`ch13/graph.ts` is chapter 4's routed graph — `plan`,
// `execute`, `advance`, `notify`, with the retry edge — compiled with a
// checkpointer."
//
// So it is chapter 4's `graph.ts`, edge for edge, with two differences the
// sentence itself asks for: the compile takes a checkpointer (chapter 4's was
// compiled without one, and `getStateHistory` on a graph with no checkpointer
// throws GraphValueError with lc_error_code "MISSING_CHECKPOINTER"), and the
// graph is therefore built by a function rather than exported as a constant.
//
// The second parameter is a default. Every printed listing in this chapter
// calls `buildGraph(openCheckpointer())` and gets chapter 4's model-backed
// planner; `run-examples.ts` and the break-it experiments pass `fixedPlan([…])`
// so a debugging exercise can be replayed on a clean clone with no key.
import { StateGraph, START, END } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { PlanState } from "./state.js";
import { decide } from "./route.js";
import { plan, type PlanNode } from "./plan.js";
import { execute, advance, notify } from "./nodes.js";

export function buildGraph(
  checkpointer: BaseCheckpointSaver,
  planner: PlanNode = plan,
) {
  return new StateGraph(PlanState)
    .addNode("plan", planner)
    .addNode("execute", execute)
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
