// ch08/before.ts
import { END, START, StateGraph } from "@langchain/langgraph";
import { isInterrupted } from "@langchain/langgraph";
import { openCheckpointer } from "./checkpointer.js";
import { findHub, placeOrder } from "./shop.js";
import { JobState, type Job } from "./state.js";

const graph = new StateGraph(JobState)
  .addNode("find_parts", async (state: Job) => ({
    part: await findHub(state.frameNumber),
    done: "find_parts",
  }))
  .addNode("order_part", async (state: Job) => {
    const part = state.part;
    if (part === null) return { note: "nothing to order" };
    return {
      orderRef: await placeOrder(part.code, part.supplier),
      done: "order_part",
    };
  })
  .addEdge(START, "find_parts")
  .addEdge("find_parts", "order_part")
  .addEdge("order_part", END)
  .compile({
    checkpointer: openCheckpointer("memory"),
    interruptBefore: ["order_part"],
  });

const config = { configurable: { thread_id: "wr-4472" } };
const paused = await graph.invoke(
  { frameNumber: "VER-8802" },
  config,
);
const snapshot = await graph.getState(config);
console.log("paused?", isInterrupted(paused));
console.log("payload:", JSON.stringify(snapshot.tasks[0]?.interrupts));
console.log("next:", snapshot.next);
console.log("part:", JSON.stringify(snapshot.values.part?.code));

// A human who is content sends nothing back at all.
const finished = await graph.invoke(null, config);
console.log("orderRef:", finished.orderRef);
