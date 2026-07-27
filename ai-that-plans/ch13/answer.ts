// ch13/answer.ts
import { Command } from "@langchain/langgraph";
import { buildGraph } from "./graph.js";
import { openCheckpointer } from "./checkpointer.js";
import { pendingPause } from "./stalled.js";

const [threadId, decision] = process.argv.slice(2);
if (!threadId || !decision) {
  throw new Error("usage: answer <thread-id> <approve|reject>");
}

const graph = buildGraph(openCheckpointer());
const config = { configurable: { thread_id: threadId } };
const pause = pendingPause(await graph.getState(config));

if (pause === undefined) {
  console.log("nothing on this thread is waiting for an answer");
} else {
  console.log(`${pause.node} asked: ${JSON.stringify(pause.value)}`);
  await graph.invoke(new Command({ resume: decision }), config);
}
