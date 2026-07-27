// ch10/fork.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";
import { snapshotAtStep } from "./at.js";

const [threadId, step, to] = process.argv.slice(2);
if (!threadId || !step || !to) {
  throw new Error("usage: fork <thread> <step> <hub>");
}

const graph = buildGraph(SqliteSaver.fromConnString("./ch10.sqlite"));
const at = await snapshotAtStep(graph, threadId, Number(step));

// The old snapshot's own config carries its checkpoint_id, so
// writing through it branches instead of extending the head.
const branch = await graph.updateState(
  at.config,
  {
    partCode: to,
    edits: {
      by: "dana",
      field: "partCode",
      from: at.values.partCode,
      to,
      why: "second opinion; the original run is untouched",
    },
  },
  "find_parts",
);

const out = await graph.invoke(null, branch);
console.log("branch  ", branch.configurable?.checkpoint_id);
console.log(out.message);
