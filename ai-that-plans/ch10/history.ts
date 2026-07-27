// ch10/history.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2] ?? "job-4817";
const graph = buildGraph(SqliteSaver.fromConnString("./ch10.sqlite"));

for await (const snap of graph.getStateHistory({
  configurable: { thread_id: threadId },
})) {
  // Checkpoint ids are time-ordered UUIDs, so they share a long
  // prefix and differ at the end. Print the end.
  const id = String(snap.config.configurable?.checkpoint_id);
  const step = String(snap.metadata?.step).padStart(3);
  const source = (snap.metadata?.source ?? "?").padEnd(6);
  const next = (snap.next.join(",") || "-").padEnd(18);
  console.log(`${step}  ${source}  ${next}  ...${id.slice(-6)}`);
}
