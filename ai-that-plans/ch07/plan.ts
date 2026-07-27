// NOT A LISTING FROM THE BOOK.
//
// ch07/graph.ts imports `plan` and this chapter never prints it, because the
// prose says it is chapter 2's plan node: the same Opus binding, the same
// `z.enum(STEP_NAMES)` guard so the planner cannot invent a seventh step, the
// same job — decide which of the shop's steps this request needs, in order,
// and do not carry them out.
//
// Two things this chapter forces, and nothing else:
//
//   1. Chapter 2's state had a `steps` field; ch07/state.ts does not (it
//      declares messages, customerId, known and summary). So the decided plan
//      is written back as an ordinary assistant turn instead.
//   2. It reads `state.known`. That is the entire point of `recall` running
//      first — those facts came out of the store, from a different thread,
//      possibly weeks ago.
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { STEP_NAMES } from "./shop.js";
import type { State, Update } from "./state.js";

const Plan = z.object({ steps: z.array(z.enum(STEP_NAMES)) });

const SYSTEM =
  "You are the Braxby Cycles workshop planner. Decide which of " +
  "the shop's steps this request needs, in the order they must " +
  "run. Return step names only. Do not carry them out.";

// The only node in this book bound to Opus.
const planner = new ChatAnthropic({
  model: "claude-opus-5",
  maxTokens: 1024,
}).withStructuredOutput(Plan, { name: "plan" });

export async function plan(state: State): Promise<Update> {
  const recalled =
    state.known.length > 0
      ? [
          new SystemMessage(
            `Known about this customer:\n- ${state.known.join("\n- ")}`,
          ),
        ]
      : [];

  const decided = await planner.invoke([
    new SystemMessage(SYSTEM),
    ...recalled,
    ...state.messages,
  ]);

  return { messages: new AIMessage(`plan: ${decided.steps.join(" -> ")}`) };
}
