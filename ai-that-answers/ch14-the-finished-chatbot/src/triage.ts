import { z } from "zod";
import { HumanMessage, SystemMessage } from "langchain";
import { chatModel } from "./model.js";

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

/**
 * includeRaw so a parse failure arrives as parsed: null rather than a thrown
 * exception in front of a waiting user.
 */
export async function triage(message: string): Promise<Triage | null> {
  const model = await chatModel();
  const triager = model.withStructuredOutput(Triage, {
    name: "triage",
    includeRaw: true,
  });

  const { raw, parsed } = await triager.invoke([
    new SystemMessage("You triage inbound support messages."),
    new HumanMessage(message),
  ]);

  if (parsed === null) {
    console.warn("could not parse", raw.text);
    return null;
  }

  return parsed;
}
