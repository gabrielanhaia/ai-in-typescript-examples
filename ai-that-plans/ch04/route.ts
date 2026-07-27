// ch04/route.ts
import type { State } from "./state.js";

/** The three decisions this graph can reach after a step has run. */
export type Route = "retry" | "continue" | "finish";

export const MAX_ATTEMPTS = 3;

export function decide(state: State): Route {
  if (state.lastError !== "") {
    return state.attempts < MAX_ATTEMPTS ? "retry" : "finish";
  }
  return state.cursor + 1 < state.steps.length ? "continue" : "finish";
}
