// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "Each specialist in `ch12/specialists.ts` is a
// `createAgent` carrying a `name` and a `description`, because the supervisor
// routes by that name and shows that description to its own model when it
// decides. `createSupervisor` takes compiled graphs, which is what `.graph`
// gives you on an agent built with `createAgent`."
//
// That is the whole specification, and this file is exactly it and nothing
// more. The four tool sets are the four the chapter prints as `AS_DRAWN` in
// ch12/split.ts — the clean decomposition, four disjoint tool sets, the one
// anybody would sign off. `AS_SHIPPED` is the object the chapter contrasts it
// with, and it is deliberately NOT what this file holds: it is what your team
// looks like after a week of fixing "the specialist could not complete its
// step", and running the overlap report on it is the point of that listing.
//
// Every agent here shares one `ChatAnthropic` instance. Four models would be
// four clients against one endpoint and would change nothing the chapter
// measures — what the chapter counts is calls and tokens, and those are the
// same either way.
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain";
import {
  bookWorkshopSlot,
  checkWarranty,
  findParts,
  lookupOrder,
  notifyCustomer,
  orderPart,
} from "./tools.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 4096,
});

export const orders = createAgent({
  model,
  name: "orders",
  description: "Finds a purchase, its frame number and its purchase date.",
  tools: [lookupOrder],
  systemPrompt:
    "You look up orders for a bike workshop. Report the order " +
    "reference, the frame number and the purchase date, then stop.",
});

export const warranty = createAgent({
  model,
  name: "warranty",
  description: "Says whether a bike is in cover, and for what.",
  tools: [checkWarranty],
  systemPrompt:
    "You decide warranty cover for a bike workshop. Say whether the " +
    "claim is in cover and what the cover includes, then stop.",
});

export const parts = createAgent({
  model,
  name: "parts",
  description: "Finds the part a frame needs and orders it from a supplier.",
  tools: [findParts, orderPart],
  systemPrompt:
    "You source parts for a bike workshop. Find the part that fits the " +
    "frame, then order it from the supplier the lookup names. Report the " +
    "part code, the supplier, the price and the order reference, then stop.",
});

export const scheduling = createAgent({
  model,
  name: "scheduling",
  description: "Books a workshop bay and drafts the message to the customer.",
  tools: [bookWorkshopSlot, notifyCustomer],
  systemPrompt:
    "You run the diary for a bike workshop. Take the next free bay for " +
    "the frame, then draft the message telling the customer when to bring " +
    "the bike in and what it will cost. Then stop.",
});
