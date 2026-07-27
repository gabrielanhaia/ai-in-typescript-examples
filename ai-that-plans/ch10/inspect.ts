// ch10/inspect.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";
import { snapshotAtStep } from "./at.js";

const [threadId, step] = process.argv.slice(2);
if (!threadId || !step) throw new Error("usage: inspect <t> <step>");

const graph = buildGraph(SqliteSaver.fromConnString("./ch10.sqlite"));
const snap = await snapshotAtStep(graph, threadId, Number(step));

console.log("id      ", snap.config.configurable?.checkpoint_id);
console.log("written ", snap.createdAt);
console.log("source  ", snap.metadata?.source);
console.log("next    ", snap.next.join(", ") || "(nothing)");
console.log("values  ", JSON.stringify(snap.values, null, 2));
