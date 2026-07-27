// ch12/team.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { orders, warranty, parts, scheduling } from "./specialists.js";

const llm = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 4096,
});

// Chapter 11's supervisor, unchanged, so that the comparison is
// between two systems you would actually be willing to ship.
export const team = createSupervisor({
  agents: [orders.graph, warranty.graph, parts.graph, scheduling.graph],
  llm,
  prompt:
    "Route each turn to one specialist. Stop as soon as the " +
    "customer has a complete answer.",
  outputMode: "last_message",
}).compile();
