// ch08/state.ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

/** What find_parts settled on. Chapter 5 kept only a part code;
 *  a human being asked to approve a purchase needs the supplier
 *  and the price too. */
export const Part = z.object({
  code: z.string(),
  name: z.string(),
  supplier: z.string(),
  priceGbp: z.number(),
});

export const JobState = new StateSchema({
  request: z.string().default(""),
  frameNumber: z.string().default(""),
  part: Part.nullable().default(null),
  orderRef: z.string().default(""),
  slot: z.string().default(""),
  note: z.string().default(""),
  done: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.string(),
    reducer: (current, next) => [...current, next],
  }),
});

export type Job = typeof JobState.State;
