// ch10/state.ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const Edit = z.object({
  by: z.string(),
  field: z.string(),
  from: z.string(),
  to: z.string(),
  why: z.string(),
});

export const JobState = new StateSchema({
  request: z.string().default(""),
  frameNumber: z.string().default(""),
  coverEndsOn: z.string().default(""),
  partCode: z.string().default(""),
  orderStatus: z.string().default(""),
  slot: z.string().default(""),
  message: z.string().default(""),

  done: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.string(),
    reducer: (current, next) => [...current, next],
  }),

  // Checkpoint metadata is written by the framework, not by you,
  // so the record of who changed what has to live in the state.
  edits: new ReducedValue(z.array(Edit).default(() => []), {
    inputSchema: Edit,
    reducer: (current, next) => [...current, next],
  }),
});

// --- NOT PRINTED IN THE BOOK -----------------------------------------------
//
// The same two aliases chapter 5 prints under its own state file. The nodes in
// ch10/steps.ts are written against them, exactly as chapter 5's are.
export type Job = typeof JobState.State;
export type JobUpdate = typeof JobState.Update;
