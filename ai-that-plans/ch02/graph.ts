// ch02/graph.ts
import { END, START, StateGraph } from "@langchain/langgraph";
import { act } from "./act.js";
import { plan } from "./plan.js";
import { PlanState } from "./state.js";

export const assistant = new StateGraph(PlanState)
  .addNode("plan", plan)
  .addNode("act", act)
  .addEdge(START, "plan")
  .addEdge("plan", "act")
  .addEdge("act", END)
  .compile();
