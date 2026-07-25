// The same information, badly and well. Bad is not a strawman — it is what a
// first draft looks like when nobody has said the rules out loud yet.
import { z } from "zod";

export const Bad = z.object({
  info: z.object({
    cat: z.string(),
    pri: z.string().optional(),
  }),
  tags: z.array(z.string()),
  customerTier: z.string(),
  estimatedCostUsd: z.number(),
});

export const Good = z.object({
  category: z
    .enum(["billing", "bug", "feature_request", "other"])
    .describe("What the message is fundamentally about."),
  urgency: z
    .enum(["low", "normal", "high"])
    .describe("How fast a human needs to look at this."),
  tags: z
    .array(z.string())
    .max(3)
    .describe("Up to three short topic labels, lowercase."),
  blockedFeature: z
    .string()
    .nullable()
    .describe("The feature the customer says is blocked, or null."),
});
