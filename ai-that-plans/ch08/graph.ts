// ch08/graph.ts
import { END, START, StateGraph } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { orderPart } from "./order-part.js";
import { bookSlot, findHub } from "./shop.js";
import { JobState, type Job } from "./state.js";

export function buildGraph(checkpointer: BaseCheckpointSaver) {
  return new StateGraph(JobState)
    .addNode("find_parts", async (state: Job) => ({
      part: await findHub(state.frameNumber),
      done: "find_parts",
    }))
    .addNode("order_part", orderPart, {
      ends: ["book_workshop_slot", "notify_customer"],
    })
    .addNode("book_workshop_slot", async (state: Job) => ({
      slot: await bookSlot(state.frameNumber),
      done: "book_workshop_slot",
    }))
    .addNode("notify_customer", async () => ({
      done: "notify_customer",
    }))
    .addEdge(START, "find_parts")
    .addEdge("find_parts", "order_part")
    .addEdge("book_workshop_slot", "notify_customer")
    .addEdge("notify_customer", END)
    .compile({ checkpointer });
}
