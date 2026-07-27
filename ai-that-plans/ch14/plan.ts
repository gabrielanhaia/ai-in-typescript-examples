// NOT A LISTING FROM CHAPTER 14.
//
// `ch14/graph.ts` imports `plan` from here, and the chapter says why it does
// not print it: "plan is chapter 2's planner — still the only node in this
// book bound to `claude-opus-5`, for the reason that chapter argued." Same
// binding, same `z.enum(STEP_NAMES)` guard so the planner cannot invent a
// seventh step, same job: decide which of the shop's steps this request
// needs, in order, and do not carry them out.
//
// One thing this assembly forces. ch14's state HAS a `steps` channel, so the
// decided plan is written to it rather than being paraphrased into a message
// the way chapter 7 had to. The `AIMessage` still goes out beside it, because
// the transcript is what the parts specialist reads when the run reaches it —
// `messages` is the only channel that crosses that boundary.
//
// Calls a model, so importing this module needs ANTHROPIC_API_KEY.
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { STEP_NAMES } from "./shop.js";
import type { Job, JobUpdate } from "./state.js";

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

export async function plan(state: Job): Promise<JobUpdate> {
  // A resumed thread already has its plan. Asking again would pay
  // Opus to re-decide something the checkpoint already records.
  if (state.steps.length > 0) return {};

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

  return {
    steps: decided.steps,
    messages: [new AIMessage(`plan: ${decided.steps.join(", ")}`)],
  };
}
