// PRINTED IN CHAPTER 7 as `ch07/naive.ts` — the catch in the wrong place.
//
// Say two of three calls work and the third raises. `Promise.all` gives up at
// the first rejection, so the two good answers are thrown away, the handler
// hands back nothing, and the following request is refused.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import type { Session } from "../ch06/session.js";

export async function naive(calls: ToolUseBlock[], session: Session) {
  try {
    return await Promise.all(
      calls.map(async (call) => ({
        type: "tool_result" as const,
        tool_use_id: call.id,
        content: await session.byName.get(call.name)!.invoke(call.input),
      })),
    );
  } catch {
    return [];
  }
}
