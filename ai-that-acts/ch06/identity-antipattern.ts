// PRINTED IN CHAPTER 6 under "The argument a tool must never take".
//
// Whatever is in a schema comes from the model. So a field like this never
// consults your own request context; it takes whoever the conversation
// happens to name, and the conversation is typed by someone else.
//
// Nothing imports this. It is here to be read beside `context.ts`.
import { z } from "zod";

export const NeverDoThis = z.object({
  customer_id: z.string().describe("The customer whose orders to list."),
  order_id: z.string().describe("The order number, like ORD-4471."),
});
