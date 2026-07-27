// ch04/limit.ts
import { GraphRecursionError } from "@langchain/langgraph";
import { graph } from "./graph.js";
import { PlanState, type State } from "./state.js";

export type Outcome =
  | { done: true; state: State }
  | { done: false; reason: "recursion-limit"; limit: number };

/** Two supersteps per planned step, one per retry allowed, two for
 *  the ends of the run, and a couple spare. */
export function budgetFor(steps: number, retries: number): number {
  return 2 * steps + retries + 4;
}

export async function runPlan(
  input: typeof PlanState.Update,
  limit: number,
): Promise<Outcome> {
  try {
    const state = await graph.invoke(input, { recursionLimit: limit });
    return { done: true, state };
  } catch (error) {
    if (error instanceof GraphRecursionError) {
      return { done: false, reason: "recursion-limit", limit };
    }
    throw error;
  }
}
