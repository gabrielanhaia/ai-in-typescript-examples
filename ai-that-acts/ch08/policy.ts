// PRINTED IN CHAPTER 8 as `ch08/policy.ts`.
//
// A pure function of the tool name and the arguments. No network, no clock,
// and no branch anywhere that reads the conversation.
import { z } from "zod";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { LANE, RUNG, type Lane } from "./ladder.js";

export interface Decision {
  readonly lane: Lane;
  readonly why: string;
}

const SmallRefund = z.object({ amount_cents: z.number().max(2_000) });

export function decide(call: ToolUseBlock): Decision {
  const rung = RUNG[call.name];
  if (rung === undefined) {
    return { lane: "confirm", why: `${call.name} is not on the ladder` };
  }

  const small = SmallRefund.safeParse(call.input).success;
  if (call.name === "issue_refund" && small) {
    return { lane: "log", why: "refund at or under £20" };
  }

  return { lane: LANE[rung], why: `${call.name} is ${rung}` };
}
