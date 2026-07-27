// ch14/state.ts
import {
  MessagesValue,
  ReducedValue,
  StateSchema,
} from "@langchain/langgraph";
import { z } from "zod";
import { STEP_NAMES } from "./shop.js";

export const JobState = new StateSchema({
  // Shared by name with the parts specialist, and therefore the
  // only channel that crosses the boundary between the two
  // graphs. Everything else here is the parent's alone.
  messages: MessagesValue,

  // What the store is keyed on. Required on the first invoke,
  // carried by the thread from then on.
  customerId: z.string(),

  // The ordered plan, and where the run has got to in it.
  steps: z.array(z.enum(STEP_NAMES)).default(() => []),
  cursor: z.number().default(0),

  // One line of outcome per step, merged by key so the delegated
  // specialist can settle two steps in a single write.
  results: new ReducedValue(
    z.record(z.string(), z.string()).default(() => ({})),
    {
      inputSchema: z.record(z.string(), z.string()),
      reducer: (current, next) => ({ ...current, ...next }),
    },
  ),

  // Filled once, at the top of the run, from the store.
  known: z.array(z.string()).default(() => []),
});

export type Job = typeof JobState.State;
export type JobUpdate = typeof JobState.Update;
