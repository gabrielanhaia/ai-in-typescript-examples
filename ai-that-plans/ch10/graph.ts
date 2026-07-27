// NOT A LISTING FROM THE BOOK.
//
// "The graph is chapter 5's six nodes in a straight line, carried over
// unchanged into `ch10/graph.ts`" — so this is ch05/graph.ts, with one import
// path pointing at this chapter's state and nothing else changed. The
// checkpointer is still a parameter, because every listing in this chapter
// opens the same SQLite file and hands it in.
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
