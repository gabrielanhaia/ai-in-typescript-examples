// NOT A LISTING FROM THE BOOK.
//
// The chapter prints the wrapper (ch05/measured.ts) and then tells you what to
// do with it: "Wrap your real checkpointer in it, run your real task twenty
// times, and read three numbers: puts against your graph's superstep count,
// writes against its task count, and ms against the wall-clock time of the
// whole run. That last ratio is the decision."
//
// This is that, once, against the SQLite file the rest of the chapter writes.
// The three numbers are the whole output. `ms` is the time spent inside the
// checkpointer; the wall clock beside it is the time the run took. Their ratio
// is the only honest way to decide whether "sync" is affordable here — and the
// answer on your laptop, against a local file and six nodes that do no work, is
// not the answer against your store and your model calls. Measure yours.
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";
import { Measured } from "./measured.js";

const [threadId, mode = "async"] = process.argv.slice(2);
if (!threadId) throw new Error("usage: measure <thread-id> [mode]");

const checkpointer = new Measured(
  SqliteSaver.fromConnString("./ch05.sqlite"),
);
const graph = buildGraph(checkpointer);

const from = performance.now();
await graph.invoke(
  { request: "Verano hybrid, rear hub grinding, under warranty" },
  {
    configurable: { thread_id: threadId },
    durability: mode as "exit" | "async" | "sync",
  },
);
const wall = performance.now() - from;

console.log(`durability:  ${mode}`);
console.log(`puts:        ${checkpointer.puts}`);
console.log(`writes:      ${checkpointer.writes}`);
console.log(`ms in store: ${checkpointer.ms.toFixed(1)}`);
console.log(`ms wall:     ${wall.toFixed(1)}`);
