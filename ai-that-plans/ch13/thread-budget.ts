// ch13/thread-budget.ts
import { GraphRecursionError } from "@langchain/langgraph";
import { buildGraph } from "./graph.js";
import { openCheckpointer } from "./checkpointer.js";
import type { PlanUpdate } from "./state.js";

/** Supersteps a single job may ever consume, across every
 *  invocation and every retry. Sized from the graph's real cost
 *  the way chapter 4 sized the per-run limit, then multiplied by
 *  the number of resumes a job is allowed to need. */
export const MAX_THREAD_STEPS = 60;

export type Result =
  | { ok: true; spent: number }
  | { ok: false; reason: "exhausted" | "recursion-limit"; spent: number };

export async function runOnce(
  threadId: string,
  input: PlanUpdate,
  limit: number,
): Promise<Result> {
  const graph = buildGraph(openCheckpointer());
  const config = { configurable: { thread_id: threadId } };
  const spent = (await graph.getState(config)).metadata?.step ?? -1;
  if (spent >= MAX_THREAD_STEPS) {
    return { ok: false, reason: "exhausted", spent };
  }
  try {
    await graph.invoke(input, { ...config, recursionLimit: limit });
    return { ok: true, spent };
  } catch (error) {
    if (error instanceof GraphRecursionError) {
      return { ok: false, reason: "recursion-limit", spent };
    }
    throw error;
  }
}
