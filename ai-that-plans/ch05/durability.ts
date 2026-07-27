// ch05/durability.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const [threadId, mode = "async"] = process.argv.slice(2);
if (!threadId) throw new Error("usage: durability <id> [mode]");

const graph = buildGraph(
  SqliteSaver.fromConnString("./ch05.sqlite"),
);

// One option, three very different failure stories. Nothing else
// about the graph changes.
await graph.invoke(
  { request: "Verano hybrid, rear hub grinding, under warranty" },
  {
    configurable: { thread_id: threadId },
    durability: mode as "exit" | "async" | "sync",
  },
);
