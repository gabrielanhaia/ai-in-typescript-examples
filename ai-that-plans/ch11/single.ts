// ch11/single.ts
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { sonnet } from "./specialists.js";
import * as shop from "../shop/tools.js";

export const single = createAgent({
  name: "assistant",
  model: sonnet,
  checkpointer: new MemorySaver(),
  tools: [
    shop.lookupOrder,
    shop.checkWarranty,
    shop.findParts,
    shop.orderPart,
    shop.bookWorkshopSlot,
    shop.notifyCustomer,
  ],
  systemPrompt:
    "You handle a customer's workshop request end to end. " +
    "Work through it one tool at a time and stop when the " +
    "job is booked and the customer has been written to.",
}).graph;
