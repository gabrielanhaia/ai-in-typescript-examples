// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "The planner node is `ch04/plan.ts`, chapter 2's, still the
// only node bound to `claude-opus-5`." So this is chapter 2's plan node, with
// two things changed and nothing else:
//
//   1. it is typed against this chapter's state, which has more fields;
//   2. the binding is built on first call rather than at import, so that
//      ch04/run-examples.ts — which only draws graphs and runs the keyless
//      ones — can import ch04/graph.ts on a machine with no key at all.
//
// No sampling parameter is set. Both models in this book reject a non-default
// temperature, top_p or top_k with a 400.
import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PlanState, State } from "./state.js";
import { STEP_NAMES } from "./tools.js";

const Plan = z.object({ steps: z.array(z.enum(STEP_NAMES)) });

const SYSTEM =
  "You are the Braxby Cycles workshop planner. Decide which of " +
  "the shop's steps this request needs, in the order they must " +
  "run. Return step names only. Do not carry them out.";

// The only node in this book bound to Opus.
function buildPlanner() {
  return new ChatAnthropic({
    model: "claude-opus-5",
    maxTokens: 1024,
  }).withStructuredOutput(Plan, { name: "plan" });
}

let planner: ReturnType<typeof buildPlanner> | undefined;

function planningModel(): ReturnType<typeof buildPlanner> {
  if ((process.env.ANTHROPIC_API_KEY ?? "") === "") {
    throw new Error(
      "ANTHROPIC_API_KEY is not set, and the plan node calls the model.\n" +
        "  1. cp ../.env.example ../.env\n" +
        "  2. put your key in it, on one line, no quotes\n" +
        "  3. run this again\n" +
        "Get a key at https://console.anthropic.com/.\n" +
        "Everything in ch04 except ch04/run.ts runs without one:\n" +
        "  npx tsx ch04/run-examples.ts",
    );
  }
  planner ??= buildPlanner();
  return planner;
}

export async function plan(state: State): Promise<typeof PlanState.Update> {
  const decided = await planningModel().invoke([
    new SystemMessage(SYSTEM),
    ...state.messages,
  ]);
  return { steps: decided.steps };
}
