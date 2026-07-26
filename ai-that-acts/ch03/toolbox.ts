// PRINTED IN CHAPTER 3 as `ch03/toolbox.ts` — both listings from that
// chapter, in the order the file needs them.
import { z } from "zod";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { defineTool } from "./define-tool.js";
import { RefundInput } from "./schema.js";
import { findOrder, issueRefund } from "./orders.js";

export interface Outcome {
  readonly content: string;
  readonly is_error: boolean;
}

export async function execute(call: ToolUseBlock): Promise<Outcome> {
  const tool = byName.get(call.name);
  if (!tool) {
    return { content: `No tool named "${call.name}".`, is_error: true };
  }
  try {
    return { content: await tool.invoke(call.input), is_error: false };
  } catch (error) {
    return { content: explain(error), is_error: true };
  }
}

function explain(error: unknown): string {
  if (error instanceof z.ZodError) {
    const why = error.issues
      .map((iss) => `${iss.path.join(".") || "(root)"}: ${iss.message}`)
      .join("; ");
    return `Those arguments are not valid — ${why}. Fix them and retry.`;
  }
  return error instanceof Error ? error.message : String(error);
}

const tools = [
  defineTool(
    "get_order_status",
    "Look up one Braxby Cycles order by its order number. Returns the " +
      "status and the order total in cents.",
    z.object({
      order_id: z.string().describe("The order number, like ORD-4471."),
    }),
    async ({ order_id }) => JSON.stringify(await findOrder(order_id)),
  ),
  defineTool(
    "issue_refund",
    "Refund part or all of an order that has already been paid for.",
    RefundInput,
    issueRefund,
  ),
];

export const definitions = tools.map((tool) => tool.definition);

const byName = new Map(tools.map((tool) => [tool.definition.name, tool]));
