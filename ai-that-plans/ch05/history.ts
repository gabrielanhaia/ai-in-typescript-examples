// ch05/history.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2];
if (!threadId) throw new Error("usage: history <thread-id>");

const graph = buildGraph(
  SqliteSaver.fromConnString("./ch05.sqlite"),
);
const config = { configurable: { thread_id: threadId } };

for await (const snap of graph.getStateHistory(config)) {
  const step = String(snap.metadata?.step).padStart(2);
  const next = (snap.next.join(",") || "-").padEnd(18);
  const done = snap.values.done ?? [];
  console.log(`${step}  ${next}  done=${done.length}`);
}
