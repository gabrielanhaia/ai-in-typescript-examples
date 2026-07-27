// ch13/state.ts
//
// PARTLY PRINTED. The chapter prints the PROGRESS constant at the bottom of
// this file and says of the rest: "`ch13/state.ts` is chapter 4's state
// declaration with that one constant added at the bottom, so the list lives
// beside the channels it names and moves when they do." So everything above
// PROGRESS is ch04/state.ts, unchanged, plus the `PlanUpdate` alias that
// ch13/thread-budget.ts imports from here.
import {
  StateSchema,
  ReducedValue,
  MessagesValue,
} from "@langchain/langgraph";
import { z } from "zod";

export const PlanState = new StateSchema({
  messages: MessagesValue,

  // The ordered plan, and where in it the run has got to.
  steps: z.array(z.string()).default(() => []),
  cursor: z.number().default(0),

  // Attempts at the step under the cursor, not at the run.
  attempts: z.number().default(0),
  lastError: z.string().default(""),

  // Progress accumulates: a step is recorded once, when it commits.
  completed: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.string(),
    reducer: (current, next) => [...current, next],
  }),
});

export type State = typeof PlanState.State;

/** What a node — or a caller — may hand back. `thread-budget.ts` types
 *  `runOnce`'s input against this. */
export type PlanUpdate = typeof PlanState.Update;

/** Progress, not effort. `attempts` and `lastError` change on
 *  every failed lap while the job stands exactly still, so
 *  including them would hide the thing we are looking for. */
export const PROGRESS = ["steps", "cursor", "completed"] as const;
