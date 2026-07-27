// ch08/pause.ts
import { INTERRUPT, isInterrupted } from "@langchain/langgraph";
import type { Proposal } from "./approval.js";
import { openCheckpointer } from "./checkpointer.js";
import { buildGraph } from "./graph.js";

const graph = buildGraph(openCheckpointer("sqlite"));
const config = { configurable: { thread_id: "wr-4471" } };

const result = await graph.invoke(
  { request: "rear hub grinding", frameNumber: "VER-8802" },
  config,
);

if (!isInterrupted<Proposal>(result)) {
  console.log("ran to the end without pausing");
} else {
  const pending = result[INTERRUPT][0];
  console.log(`awaiting: ${pending.value?.summary}`);
  console.log(`interrupt id: ${pending.id}`);
}

// The same pause read from the store rather than from the return
// value — this is all another process gets.
const snapshot = await graph.getState(config);
console.log(`next: ${snapshot.next.join(", ")}`);
console.log(`open: ${snapshot.tasks[0]?.interrupts.length ?? 0}`);
