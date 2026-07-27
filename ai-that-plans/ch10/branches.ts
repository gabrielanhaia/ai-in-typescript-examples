// ch10/branches.ts
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2] ?? "job-4818";
const graph = buildGraph(SqliteSaver.fromConnString("./ch10.sqlite"));

const parent = new Map<string, string | undefined>();
const label = new Map<string, string>();
for await (const s of graph.getStateHistory({
  configurable: { thread_id: threadId },
})) {
  const id = String(s.config.configurable?.checkpoint_id);
  parent.set(id, s.parentConfig?.configurable?.checkpoint_id);
  label.set(id, `${s.metadata?.step}:${id.slice(-4)}`);
}

// A leaf is a checkpoint nobody claims as a parent. One leaf per
// branch, so one line of output per branch.
const claimed = new Set(parent.values());
for (const leaf of parent.keys()) {
  if (claimed.has(leaf)) continue;
  const line: string[] = [];
  for (let at = leaf as string | undefined; at; at = parent.get(at)) {
    line.unshift(label.get(at) ?? "?");
  }
  console.log(line.join(">"));
}
