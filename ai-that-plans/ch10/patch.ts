// ch10/patch.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const [threadId, to] = process.argv.slice(2);
if (!threadId || !to) throw new Error("usage: patch <thread> <hub>");

const graph = buildGraph(SqliteSaver.fromConnString("./ch10.sqlite"));
const config = { configurable: { thread_id: threadId } };
const from = (await graph.getState(config)).values.partCode;

// asNode is whose write this is. It decides how the reducers
// merge the values and where the graph picks up afterwards.
const written = await graph.updateState(
  config,
  {
    partCode: to,
    edits: {
      by: "dana",
      field: "partCode",
      from,
      to,
      why: "VER-8802 takes the VR-142 hub",
    },
  },
  "find_parts",
);

const after = await graph.getState(config);
console.log("wrote   ", written.configurable?.checkpoint_id);
console.log("resumes ", after.next.join(", ") || "(nothing)");
console.log((await graph.invoke(null, config)).message);
