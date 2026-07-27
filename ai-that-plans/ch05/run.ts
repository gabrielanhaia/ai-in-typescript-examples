// ch05/run.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2];
if (!threadId) throw new Error("usage: run <thread-id>");

const checkpointer = SqliteSaver.fromConnString("./ch05.sqlite");
const graph = buildGraph(checkpointer);

const state = await graph.invoke(
  { request: "Verano hybrid, rear hub grinding, under warranty" },
  { configurable: { thread_id: threadId } },
);

console.log("finished:", state.done.join(" -> "));
