// NOT A LISTING FROM THE BOOK.
//
// Chapter 4's router, unchanged. The chapter names it — "`decide` is six
// lines of TypeScript in your repository; it makes no request, and every one
// of the three causes above reproduces in a unit test with a hand-built state
// object and no network" — and then never prints it again, because it has not
// moved since chapter 4.
//
// Read it beside the three loop causes. It reads `lastError`, `attempts`,
// `cursor` and `steps`; the loop is always a channel in that list that the
// cycle either never clears or never writes.
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
