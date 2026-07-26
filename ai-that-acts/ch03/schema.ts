// PRINTED IN CHAPTER 3 as `ch03/schema.ts`.
import { z } from "zod";

export const RefundInput = z.strictObject({
  order_id: z
    .string()
    .describe("The order to refund, in the form ORD-4471."),
  amount_cents: z
    .number()
    .int()
    .positive()
    .describe("Refund amount in cents. Never over the order total."),
  reason: z
    .enum(["damaged", "late", "wrong_item", "goodwill"])
    .describe("Why the refund is being issued."),
  note: z
    .string()
    .max(200)
    .optional()
    .describe("An optional note stored on the refund record."),
});

export type RefundInput = z.infer<typeof RefundInput>;
