// ch03/plan-channel.ts
import { ReducedValue } from "@langchain/langgraph";
import { z } from "zod";

export const Step = z.object({
  tool: z.string(),
  why: z.string(),
});

/**
 * The plan is written once per run. A second write means a node
 * re-planned when it should have read, so keep the first plan and
 * let the run fail loudly rather than quietly change course.
 */
export const PlanOnce = new ReducedValue(
  z.array(Step).default(() => []),
  {
    inputSchema: z.array(Step),
    reducer: (current, next) =>
      current.length === 0 ? next : current,
  },
);
