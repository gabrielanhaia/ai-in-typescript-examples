// PRINTED IN CHAPTER 8 as `ch08/audit.ts` — the seven fields.
//
// The function around them is not printed. It is emitted ahead of execution,
// which is what leaves evidence of the decision even when the call itself
// dies part-way through.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";

export function record(
  call: ToolUseBlock,
  verdict: "ran" | "approved" | "declined",
  why: string,
  plan?: string,
): void {
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      tool: call.name,
      tool_use_id: call.id,
      args: call.input,
      verdict,
      why,
      shown: plan,
    }),
  );
}
