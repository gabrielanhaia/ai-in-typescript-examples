// ch04/nodes.ts
import { AIMessage } from "@langchain/core/messages";
import type { State } from "./state.js";
import { runStep } from "./tools.js";

export async function execute(state: State) {
  const step = state.steps[state.cursor];
  const result = await runStep(step, state.cursor);
  const attempts = state.attempts + 1;
  if (!result.ok) return { attempts, lastError: result.error };
  return { attempts, lastError: "", completed: step };
}

/** The only place the cursor moves and the per-step counter resets. */
export function advance(state: State) {
  return { cursor: state.cursor + 1, attempts: 0 };
}

export function notify(state: State) {
  const text =
    state.lastError === ""
      ? `Done: ${state.completed.join(", ")}.`
      : `Stopped at ${state.steps[state.cursor]}: ${state.lastError}`;
  return { messages: [new AIMessage(text)] };
}
