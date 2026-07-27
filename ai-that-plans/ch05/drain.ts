// ch05/drain.ts
import { GraphDrained, RunControl } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2];
if (!threadId) throw new Error("usage: drain <thread-id>");

const graph = buildGraph(
  SqliteSaver.fromConnString("./ch05.sqlite"),
);

// One control per run. The handler only sets a flag; the graph
// decides when to act on it.
const control = new RunControl();
process.on("SIGTERM", () => control.requestDrain("sigterm"));

try {
  const state = await graph.invoke(
    { request: "Verano hybrid, rear hub grinding, under warranty" },
    { configurable: { thread_id: threadId }, control },
  );
  console.log("finished:", state.done.join(" -> "));
} catch (error) {
  if (!(error instanceof GraphDrained)) throw error;
  console.log(`drained: ${error.reason}`);
  console.log(`thread ${threadId} is resumable`);
}
