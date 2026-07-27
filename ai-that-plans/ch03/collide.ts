// ch03/collide.ts
import { END, START, StateGraph } from "@langchain/langgraph";
import { PlanState } from "./state.js";

// Two nodes, one superstep, one last-value channel.
const graph = new StateGraph(PlanState)
  .addNode("split", () => ({}))
  .addNode("left", () => ({ cursor: 1 }))
  .addNode("right", () => ({ cursor: 2 }))
  .addEdge(START, "split")
  .addEdge("split", "left")
  .addEdge("split", "right")
  .addEdge("left", END)
  .addEdge("right", END)
  .compile();

await graph.invoke({});
