// ch04/state.ts
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
