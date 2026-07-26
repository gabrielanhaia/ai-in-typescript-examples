// PRINTED IN CHAPTER 8 as `ch08/plans.ts` — the `Plan` type and
// `refundPlan`.
//
// NOT PRINTED: the second map. Preview and execution are two different
// functions, looked up in two different places, and only one of them is
// reachable from anything the model can fill in.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { findOrder } from "../ch03/orders.js";
import { RefundInput } from "../ch03/schema.js";
import { money } from "../app/money.js";

/** A plan runs every read the real call would run, and none of the
 *  writes. It returns one paragraph a human can approve or refuse. */
export type Plan = (raw: unknown) => Promise<string>;

export const refundPlan: Plan = async (raw) => {
  const { order_id, amount_cents, reason } = RefundInput.parse(raw);
  const order = await findOrder(order_id);

  return (
    `Refund ${money.format(amount_cents / 100)} against order ` +
    `${order.order_id} (${reason}). The order total is ` +
    `${money.format(order.total_cents / 100)} and its status is ` +
    `${order.status}. This cannot be undone from here.`
  );
};

const PLANS: Record<string, Plan> = { issue_refund: refundPlan };

export async function planFor(call: ToolUseBlock): Promise<string> {
  const plan = PLANS[call.name];
  if (plan === undefined) {
    return (
      `Run ${call.name} with ${JSON.stringify(call.input)}. ` +
      `There is no dry-run for this tool, so this is the arguments and ` +
      `nothing else.`
    );
  }

  try {
    return await plan(call.input);
  } catch (error) {
    // A plan that cannot be built is not a reason to run the call.
    return (
      `Could not build a preview for ${call.name}: ` +
      `${error instanceof Error ? error.message : String(error)}. ` +
      `The arguments were ${JSON.stringify(call.input)}.`
    );
  }
}
