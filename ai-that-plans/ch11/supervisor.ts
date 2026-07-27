// ch11/supervisor.ts
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver } from "@langchain/langgraph";
import { build } from "./specialists.js";

const planner = new ChatAnthropic({
  model: "claude-opus-5",
  maxTokens: 8192,
});

export const supervised = createSupervisor({
  agents: build(() => []).map((a) => a.graph),
  llm: planner,
  supervisorName: "supervisor",
  outputMode: "last_message",
  prompt:
    "You coordinate a bike workshop. Delegate one step at a " +
    "time to exactly one specialist, wait for its result, then " +
    "decide the next step from what it reported. Never do a " +
    "specialist's work yourself. When the job is finished, " +
    "write the answer to the customer.",
}).compile({ checkpointer: new MemorySaver() });
