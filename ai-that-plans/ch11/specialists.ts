// ch11/specialists.ts
import { createAgent } from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import type { ClientTool } from "@langchain/core/tools";
import * as shop from "../shop/tools.js";

export const sonnet = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 8192,
});

/** Four fields: the node name a router addresses, the sentence a
 *  router reads to choose, the brief the specialist works to, and
 *  the smallest tool set that can finish its part of the job. */
export const SPECIALISTS = [
  {
    name: "orders",
    description: "Finds a purchase and its frame number.",
    brief:
      "Look up the customer's purchase. Report the frame " +
      "number and the purchase date. Do not advise on repairs.",
    tools: [shop.lookupOrder],
  },
  {
    name: "warranty",
    description: "Decides whether a fault is in cover.",
    brief:
      "Given a frame number and a purchase date, say whether " +
      "the fault is covered and quote the clause that decides.",
    tools: [shop.checkWarranty],
  },
  {
    name: "parts",
    description: "Prices, checks stock, and orders a part.",
    brief:
      "Find the part that fits, report stock and price, and " +
      "order it only when you have been told to.",
    tools: [shop.findParts, shop.orderPart],
  },
  {
    name: "scheduling",
    description: "Books the workshop and writes to the customer.",
    brief:
      "Book the earliest slot after the part arrives, then " +
      "draft the message that tells the customer what happens.",
    tools: [shop.bookWorkshopSlot, shop.notifyCustomer],
  },
];

/** `extra` is how one set of briefs serves two topologies: the
 *  supervisor adds nothing, the swarm adds a transfer tool per
 *  peer. Nothing else about a specialist changes between them. */
export function build(extra: (name: string) => ClientTool[]) {
  return SPECIALISTS.map((s) =>
    createAgent({
      name: s.name,
      description: s.description,
      model: sonnet,
      tools: [...s.tools, ...extra(s.name)],
      systemPrompt: `${s.brief} When your part is done, stop.`,
    }),
  );
}
