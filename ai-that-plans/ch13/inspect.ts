// ch13/inspect.ts
import type { StateSnapshot } from "@langchain/langgraph";
import { buildGraph } from "./graph.js";
import { openCheckpointer } from "./checkpointer.js";
import { fingerprint, pick } from "./fingerprint.js";
import { PROGRESS } from "./state.js";

const threadId = process.argv[2];
if (!threadId) throw new Error("usage: inspect <thread-id>");

const graph = buildGraph(openCheckpointer());
const config = { configurable: { thread_id: threadId } };

// History comes back newest-first; a run reads forwards.
const snaps: StateSnapshot[] = [];
for await (const snap of graph.getStateHistory(config)) {
  snaps.push(snap);
}
snaps.reverse();

let previous = "";
for (const snap of snaps) {
  const mark = fingerprint(pick(snap.values, PROGRESS));
  const moved = mark === previous ? "=" : "+";
  previous = mark;
  const step = String(snap.metadata?.step ?? "?").padStart(3);
  const next = (snap.next.join(",") || "-").padEnd(12);
  const paused = snap.tasks.some((t) => t.interrupts.length > 0);
  const failed = snap.tasks.some((t) => t.error !== undefined);
  const flag = paused ? " PAUSED" : failed ? " ERROR" : "";
  console.log(`${step} ${moved} ${next}${flag}`);
}
