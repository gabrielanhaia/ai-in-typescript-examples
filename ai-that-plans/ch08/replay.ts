// ch08/replay.ts
import {
  Command,
  END,
  MemorySaver,
  START,
  StateGraph,
  StateSchema,
  interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const Counted = new StateSchema({ answer: z.string().default("") });
let entries = 0;

const graph = new StateGraph(Counted)
  .addNode("gate", async () => {
    entries += 1;
    console.log(`node body entered ${entries} time(s)`);
    return { answer: interrupt<string, string>("proceed?") };
  })
  .addEdge(START, "gate")
  .addEdge("gate", END)
  .compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: "replay" } };
await graph.invoke({}, config);
await graph.invoke(new Command({ resume: "yes" }), config);
console.log(`one pause, ${entries} executions`);
