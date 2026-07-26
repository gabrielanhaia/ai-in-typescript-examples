// PRINTED IN CHAPTER 8 as `ch08/gate.ts`.
//
// `run` arrives unevaluated. Every branch below chooses a lane before it can
// possibly be invoked.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import type { Outcome } from "../ch03/toolbox.js";
import { decide } from "./policy.js";
import { record } from "./audit.js";

export interface Reviewer {
  /** Resolves true to run the call, false to decline it. Never throws. */
  readonly ask: (call: ToolUseBlock, plan: string) => Promise<boolean>;
}

export async function gated(
  call: ToolUseBlock,
  plan: (call: ToolUseBlock) => Promise<string>,
  reviewer: Reviewer,
  run: () => Promise<Outcome>,
): Promise<Outcome> {
  const { lane, why } = decide(call);
  if (lane === "auto") return run();
  if (lane === "log") {
    record(call, "ran", why);
    return run();
  }

  const preview = await plan(call);
  const approved = await reviewer.ask(call, preview);
  record(call, approved ? "approved" : "declined", why, preview);
  if (approved) return run();

  return {
    content:
      `A human reviewer declined this call, so nothing was changed. ` +
      `Tell the customer this needs an approval you cannot give, and ` +
      `ask what else you can help with. Do not call it again.`,
    is_error: true,
  };
}
