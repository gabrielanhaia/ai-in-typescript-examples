// ch05/state.ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const JobState = new StateSchema({
  request: z.string().default(""),
  frameNumber: z.string().default(""),
  coverEndsOn: z.string().default(""),
  partCode: z.string().default(""),
  orderStatus: z.string().default(""),
  slot: z.string().default(""),

  // Every node appends its own name, so a resumed run can prove
  // which steps it did not have to do a second time.
  done: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.string(),
    reducer: (current, next) => [...current, next],
  }),
});

export type Job = typeof JobState.State;
export type JobUpdate = typeof JobState.Update;
