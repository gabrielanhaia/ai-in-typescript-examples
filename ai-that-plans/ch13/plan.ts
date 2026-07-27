// NOT A LISTING FROM THE BOOK.
//
// Chapter 4's planner node, which chapter 13 inherits along with the rest of
// chapter 4's graph. Two things differ from the page, both of them repository
// glue and both of them already explained in ch04/plan.ts:
//
//   1. it is typed against this chapter's state;
//   2. the binding is built on first call rather than at import, so that
//      `ch13/inspect.ts` and `ch13/draw.ts` — which read checkpoints and draw
//      edges, and call no model at all — can import `ch13/graph.ts` on a
//      machine with no key.
//
// `fixedPlan` is chapter 13's own addition and is the reason this chapter is
// runnable on a clean clone. Every diagnostic in this chapter reads a thread
// that has ALREADY gone wrong, so the threads have to be written first; asking
// a model for the plan would make the printed traces different on every
// machine and would put a bill on a debugging exercise. `fixedPlan(steps)` is
// the same node with the answer already decided, which is what a replayed
// incident is.
//
// No sampling parameter is set. Both models in this book reject a non-default
// temperature, top_p or top_k with a 400.
import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PlanUpdate, State } from "./state.js";
import { STEP_NAMES } from "./tools.js";

/** What `buildGraph` wires in as the "plan" node. */
export type PlanNode = (state: State) => Promise<PlanUpdate> | PlanUpdate;

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
        "Nothing else in ch13 needs one — the chapter reads checkpoints:\n" +
        "  npx tsx ch13/run-examples.ts",
    );
  }
  planner ??= buildPlanner();
  return planner;
}

export async function plan(state: State): Promise<PlanUpdate> {
  const decided = await planningModel().invoke([
    new SystemMessage(SYSTEM),
    ...state.messages,
  ]);
  return { steps: decided.steps };
}

/** The planner an incident already has an answer for. Writes `steps` in its
 *  own superstep, exactly as the model-backed node does, which is why step 1
 *  of every trace in this chapter reads `+`. */
export function fixedPlan(steps: readonly string[]): PlanNode {
  return () => ({ steps: [...steps] });
}
