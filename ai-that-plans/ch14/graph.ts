// ch14/graph.ts
import {
  END,
  START,
  StateGraph,
  type BaseCheckpointSaver,
  type BaseStore,
} from "@langchain/langgraph";
import { advance, collect, execute } from "./nodes.js";
import { partsSpecialist } from "./parts.js";
import { plan } from "./plan.js";
import { recall, remember } from "./memory.js";
import { route } from "./route.js";
import { JobState } from "./state.js";

const parts = partsSpecialist.graph;

export function buildAssistant(
  checkpointer: BaseCheckpointSaver,
  store: BaseStore,
) {
  return new StateGraph(JobState)
    .addNode("recall", recall)
    .addNode("plan", plan)
    .addNode("execute", execute)
    .addNode("parts", parts, { subgraphs: [parts] })
    .addNode("collect", collect)
    .addNode("advance", advance)
    .addNode("remember", remember)
    .addEdge(START, "recall")
    .addEdge("recall", "plan")
    .addEdge("plan", "advance")
    .addConditionalEdges("advance", route, {
      work: "execute",
      delegate: "parts",
      finish: "remember",
    })
    .addEdge("execute", "advance")
    .addEdge("parts", "collect")
    .addEdge("collect", "advance")
    .addEdge("remember", END)
    .compile({ checkpointer, store });
}
