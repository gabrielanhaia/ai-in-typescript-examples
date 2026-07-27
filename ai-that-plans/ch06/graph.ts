// ch06/graph.ts
import {
  END,
  START,
  StateGraph,
  type BaseCheckpointSaver,
} from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { JobState } from "./state.js";
import { TOOLS, runTool } from "./shop.js";

// The planner binding from chapter 2, unchanged.
const planner = new ChatAnthropic({
  model: "claude-opus-5",
  maxTokens: 2048,
}).withStructuredOutput(
  z.object({ steps: z.array(z.enum(TOOLS)).min(1) }),
);

export function buildGraph(checkpointer: BaseCheckpointSaver) {
  return new StateGraph(JobState)
    .addNode("plan", async (s) => ({
      steps: (await planner.invoke(s.messages)).steps,
    }))
    .addNode("work", async (s) => ({
      done: await runTool(s.steps[s.done.length]),
    }))
    .addEdge(START, "plan")
    .addEdge("plan", "work")
    .addConditionalEdges("work", (s) =>
      s.done.length < s.steps.length ? "work" : END,
    )
    .compile({ checkpointer });
}
