// ch05/resume.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2];
if (!threadId) throw new Error("usage: resume <thread-id>");

const checkpointer = SqliteSaver.fromConnString("./ch05.sqlite");
const graph = buildGraph(checkpointer);
const config = { configurable: { thread_id: threadId } };

const before = await graph.getState(config);
if (before.next.length === 0) {
  throw new Error(`Nothing to resume on ${threadId}`);
}
const done: string[] = before.values.done ?? [];
console.log("resuming at:", before.next.join(", "));
console.log("already done:", done.join(", ") || "(nothing)");

// Null input means "carry on from the checkpoint", not "start
// again with nothing".
const state = await graph.invoke(null, config);
console.log("finished:", state.done.join(" -> "));
