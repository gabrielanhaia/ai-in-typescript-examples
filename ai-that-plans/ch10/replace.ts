// ch10/replace.ts
import { Overwrite } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2] ?? "job-4817";
const graph = buildGraph(SqliteSaver.fromConnString("./ch10.sqlite"));
const config = { configurable: { thread_id: threadId } };

// An update goes through the channel's reducer, so a plain string
// here would append. Overwrite bypasses the reducer instead.
await graph.updateState(
  config,
  { done: new Overwrite(["lookup_order", "check_warranty"]) },
  "check_warranty",
);

console.log((await graph.getState(config)).values.done);
