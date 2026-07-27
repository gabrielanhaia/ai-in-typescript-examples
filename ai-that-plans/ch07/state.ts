// ch07/state.ts
import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const PlanState = new StateSchema({
  messages: MessagesValue,

  /** The key the store is organized by. It never changes during a
   *  run, and every store call in the graph needs it. */
  customerId: z.string(),

  /** Filled once, at the top of the run, from the store. */
  known: z.array(z.string()).default(() => []),

  /** What the compaction node folded the old turns into. */
  summary: z.string().default(""),
});

export type State = typeof PlanState.State;
export type Update = typeof PlanState.Update;
