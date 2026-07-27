// ch07/graph.ts
import {
  END,
  InMemoryStore,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { PlanState } from "./state.js";
import { recall } from "./recall.js";
import { plan } from "./plan.js";
import { remember } from "./remember.js";

/** Two persistence layers, one process. The checkpointer owns this
 *  thread; the store owns everything meant to outlive it. Chapter
 *  6's checkpointers drop straight in — the store wiring does not
 *  change. */
export const graph = new StateGraph(PlanState)
  .addNode("recall", recall)
  .addNode("plan", plan)
  .addNode("remember", remember)
  .addEdge(START, "recall")
  .addEdge("recall", "plan")
  .addEdge("plan", "remember")
  .addEdge("remember", END)
  .compile({
    checkpointer: new MemorySaver(),
    store: new InMemoryStore(),
  });
