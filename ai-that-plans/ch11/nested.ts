// ch11/nested.ts
import {
  END,
  MemorySaver,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import { build } from "./specialists.js";

const [, , parts] = build(() => []);
const partsGraph = parts.graph;

export const TeamState = new StateSchema({
  messages: MessagesValue,
});

/** One thread, one chain. `partsGraph` was compiled without a
 *  checkpointer of its own, so it inherits this one and writes
 *  its checkpoints under this thread in its own namespace. */
export const nested = new StateGraph(TeamState)
  .addNode("parts", partsGraph, { subgraphs: [partsGraph] })
  .addEdge(START, "parts")
  .addEdge("parts", END)
  .compile({ checkpointer: new MemorySaver() });
