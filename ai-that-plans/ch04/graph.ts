// ch04/graph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { PlanState } from "./state.js";
import { decide } from "./route.js";
import { plan } from "./plan.js";
import { execute, advance, notify } from "./nodes.js";

export const graph = new StateGraph(PlanState)
  .addNode("plan", plan)
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
  .compile();
