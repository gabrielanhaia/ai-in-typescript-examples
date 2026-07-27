// ch02/plan.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { State, Update } from "./state.js";
import { STEP_NAMES } from "./tools.js";

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
  const decided = await planner.invoke([
    new SystemMessage(SYSTEM),
    ...state.messages,
  ]);
  return { steps: decided.steps };
}
