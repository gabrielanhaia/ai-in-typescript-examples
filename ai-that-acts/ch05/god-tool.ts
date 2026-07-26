// PRINTED IN CHAPTER 5 as `ch05/god-tool.ts` — the shape to recognise, not
// the shape to copy. Nothing imports it and nothing runs it; it is here so
// `ch05/run-examples.ts` can print what it emits.
import { z } from "zod";

export const manageOrder = z.object({
  action: z
    .string()
    .describe("look_up, refund, cancel, reship or change_address"),
  payload: z
    .record(z.string(), z.unknown())
    .describe("The arguments for the action."),
});
