// ch05/graph.ts
import { END, START, StateGraph } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { JobState } from "./state.js";
import {
  bookSlot,
  checkWarranty,
  findParts,
  lookupOrder,
  notifyCustomer,
  orderPart,
} from "./steps.js";

/** The checkpointer is a parameter because it is the only thing
 *  chapter 6 changes. Nothing else in this file knows or cares
 *  where the state is being written. */
export function buildGraph(checkpointer: BaseCheckpointSaver) {
  return new StateGraph(JobState)
    .addNode("lookup_order", lookupOrder)
    .addNode("check_warranty", checkWarranty)
    .addNode("find_parts", findParts)
    .addNode("order_part", orderPart)
    .addNode("book_workshop_slot", bookSlot)
    .addNode("notify_customer", notifyCustomer)
    .addEdge(START, "lookup_order")
    .addEdge("lookup_order", "check_warranty")
    .addEdge("check_warranty", "find_parts")
    .addEdge("find_parts", "order_part")
    .addEdge("order_part", "book_workshop_slot")
    .addEdge("book_workshop_slot", "notify_customer")
    .addEdge("notify_customer", END)
    .compile({ checkpointer });
}
