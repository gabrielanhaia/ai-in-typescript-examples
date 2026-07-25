import { z } from "zod";

export const Actions = z.object({
  items: z
    .array(
      z.object({
        what: z.string().describe("The action, as a verb phrase."),
        owner: z
          .string()
          .nullable()
          .describe("Who is named as responsible, or null."),
        dueDate: z
          .string()
          .nullable()
          .describe("ISO date if one is stated, else null."),
      }),
    )
    .max(10)
    .describe("Actions explicitly agreed in the message."),
});

export type Actions = z.infer<typeof Actions>;
