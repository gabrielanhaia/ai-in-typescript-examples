// PRINTED IN CHAPTER 7 as `ch07/refund.ts` — the `fetch` with the
// idempotency key on it.
//
// NOT PRINTED: the tool around it. The chapter says where the key comes from
// (the `tool_use` block's id, held for the duration of that call and across
// nothing else) and what "already done" has to look like coming back; this is
// those two paragraphs as code.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { defineTool, type RegisteredTool } from "../ch03/define-tool.js";
import { RefundInput } from "../ch03/schema.js";
import { apiGet } from "../ch06/api.js";
import type { ToolContext } from "../ch06/context.js";
import { BASE } from "../app/config.js";
import { money } from "../app/money.js";
import { attempt } from "./attempt.js";
import { HttpFailure, kindOf } from "./classify.js";
import { currentCall } from "./run-one.js";

const Order = z.object({ order_id: z.string(), total_cents: z.number() });
const Refunded = z.object({ refund_id: z.string(), repeat: z.boolean() });

export async function postRefund(
  input: unknown,
  key: string,
  ctx: ToolContext,
): Promise<Response> {
  const response = await fetch(new URL("/api/refunds", BASE), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": key,
      authorization: `Bearer ${ctx.token}`,
    },
    body: JSON.stringify(input),
    signal: AbortSignal.any([ctx.signal, AbortSignal.timeout(10_000)]),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new HttpFailure(
      response.status,
      `refunds api ${response.status}: ${detail}`,
      kindOf(response.status) === "transient"
        ? "The refund service is not answering. It has already been " +
          "retried three times, and the refund has not been issued. " +
          "Tell the customer you cannot process it right now and that " +
          "somebody will pick it up. Do not call this tool again in " +
          "this conversation."
        : "The refund service refused that request and the refund has " +
          "not been issued. Do not call this tool again in this " +
          "conversation.",
    );
  }

  return response;
}

export function refundTool(ctx: ToolContext): RegisteredTool {
  return defineTool(
    "issue_refund",
    "Refund part or all of an order that has already been paid for. " +
      "Amounts are in cents and can never exceed the order total. A " +
      "person reviews this before it runs and may decline it, so tell " +
      "the customer you are putting it to someone rather than that the " +
      "money is on its way.",
    RefundInput,
    async (input) => {
      // Chapter 7's cheap defence: read the state first, so an argument
      // that cannot work never becomes a write at all.
      const lookup = await apiGet(`/api/orders/${input.order_id}`, ctx);
      if (!lookup.ok && lookup.status === 404) {
        return (
          `There is no order ${input.order_id} on this account, so ` +
          `there is nothing to refund. Ask the customer to re-read the ` +
          `number from their confirmation email.`
        );
      }
      if (!lookup.ok) {
        throw new HttpFailure(
          lookup.status,
          `orders api ${lookup.status}: ${lookup.detail}`,
          "The order system is not answering, so the refund was not " +
            "issued. Tell the customer you could not complete it.",
        );
      }

      const order = Order.parse(lookup.body);
      if (input.amount_cents > order.total_cents) {
        throw new Error(
          `Order ${order.order_id} totals ${order.total_cents} cents ` +
            `and you asked to refund ${input.amount_cents}. Refund at ` +
            `most the order total, or ask the customer whether they ` +
            `meant a different order.`,
        );
      }

      // One key for one requested call, across every retry `attempt`
      // makes and across nothing else.
      const key = currentCall()?.id ?? randomUUID();
      const response = await attempt(() => postRefund(input, key, ctx));
      const { refund_id, repeat } = Refunded.parse(await response.json());

      const amount = money.format(input.amount_cents / 100);
      return repeat
        ? `That refund was already issued as ${refund_id}. Nothing ` +
            `more is needed — tell the customer it is on its way.`
        : `Refunded ${amount} against ${order.order_id}, reference ` +
            `${refund_id}.`;
    },
  );
}
