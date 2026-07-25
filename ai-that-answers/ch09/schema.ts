import { z } from "zod";

export const Triage = z.object({
  category: z
    .enum(["billing", "bug", "feature_request", "other"])
    .describe("What the message is fundamentally about."),
  urgency: z
    .enum(["low", "normal", "high"])
    .describe("How fast a human needs to look at this."),
  summary: z
    .string()
    .max(200)
    .describe("One sentence, in the customer's own terms."),
  productArea: z
    .string()
    .nullable()
    .describe("The area the customer names, or null if none."),
});

export type Triage = z.infer<typeof Triage>;
