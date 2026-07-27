// ch08/resume.ts
import { Command } from "@langchain/langgraph";
import type { Decision } from "./approval.js";
import { openCheckpointer } from "./checkpointer.js";
import { buildGraph } from "./graph.js";

const answers: Record<string, Decision> = {
  approve: { type: "approve" },
  edit: {
    type: "edit",
    code: "HUB-VR-142-B",
    supplier: "Marchmont Wheelworks",
    priceGbp: 61,
  },
  reject: { type: "reject", reason: "Customer wants a quote first." },
};

const decision = answers[process.argv[2] ?? "approve"];
if (decision === undefined) throw new Error("approve|edit|reject");

const graph = buildGraph(openCheckpointer("sqlite"));
const config = { configurable: { thread_id: "wr-4471" } };

const final = await graph.invoke(
  new Command({ resume: decision }),
  config,
);
console.log(`orderRef: ${final.orderRef || "(none)"}`);
console.log(`note: ${final.note || "(none)"}`);
console.log(`done: ${final.done.join(" -> ")}`);
