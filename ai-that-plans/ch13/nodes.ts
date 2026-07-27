// NOT A LISTING FROM THE BOOK.
//
// Chapter 4's three nodes, which this chapter's `graph.ts` is built from — the
// chapter says so: "`ch13/graph.ts` is chapter 4's routed graph — `plan`,
// `execute`, `advance`, `notify`, with the retry edge — compiled with a
// checkpointer." Chapter 4 printed them; this chapter does not reprint them,
// and it changes `execute` in exactly two ways, both of which the prose
// requires:
//
// 1. `execute` appends to `messages` on every attempt. §"Progress is not the
//    same as movement" describes a broken run as one where "`attempts` ticks
//    up, a timestamp moves, a message gets appended", and §"The three causes"
//    says "the two nodes in the loop write `attempts` and `messages`". Without
//    the append, the chapter's second experiment — add `messages` to PROGRESS
//    and watch the detector go blind — cannot fire.
//
// 2. `execute` raises chapter 8's pause in front of the step that spends the
//    shop's money. Job 4823's newest checkpoint is `execute`, PAUSED, and the
//    chapter says the interrupt carries "the part code and the price the
//    assistant proposes to commit to". `interrupt()` is above every effect in
//    the node, which is chapter 8's rule and the reason the chapter's third
//    experiment — swallow the interrupt in a try/catch — buys a hub.
//
// Neither change touches a progress channel, so the four-column trace the
// chapter prints is the trace this file produces.
import { AIMessage } from "@langchain/core/messages";
import { interrupt } from "@langchain/langgraph";
import type { PlanUpdate, State } from "./state.js";
import { MAX_ATTEMPTS } from "./route.js";
import { proposalFor, runStep, type Proposal } from "./tools.js";

export async function execute(state: State): Promise<PlanUpdate> {
  const step = state.steps[state.cursor];

  // Nothing above this line may have an effect: on resume the node body runs
  // again from the top, and only interrupt() remembers the answer.
  const proposal = await proposalFor(step);
  if (proposal !== null) {
    const answer = interrupt<Proposal, string>(proposal);
    if (answer !== "approve") {
      // Declined. Not a retryable failure — asking again would raise the
      // same pause — so spend the budget and let decide() take "finish".
      return {
        attempts: MAX_ATTEMPTS,
        lastError: `${step}: declined (${answer})`,
        messages: [new AIMessage(`${step} declined: ${answer}`)],
      };
    }
  }

  const result = await runStep(step, state.cursor);
  const attempts = state.attempts + 1;
  if (!result.ok) {
    return {
      attempts,
      lastError: result.error,
      messages: [new AIMessage(`${step} attempt ${attempts}: ${result.error}`)],
    };
  }
  return {
    attempts,
    lastError: "",
    completed: step,
    messages: [new AIMessage(`${step}: ${result.output}`)],
  };
}

/** The only place the cursor moves and the per-step counter resets. */
export function advance(state: State): PlanUpdate {
  return { cursor: state.cursor + 1, attempts: 0 };
}

export function notify(state: State): PlanUpdate {
  const text =
    state.lastError === ""
      ? `Done: ${state.completed.join(", ")}.`
      : `Stopped at ${state.steps[state.cursor]}: ${state.lastError}`;
  return { messages: [new AIMessage(text)] };
}
