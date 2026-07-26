// PRINTED IN CHAPTER 4 under "Return one tool_result per message" — the
// second bug on purpose.
//
// A single call goes through fine, which is the trap. Two calls and the first
// message covers only one of them, so the second is left without a result.
import type {
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";

export function pushSeparately(
  messages: MessageParam[],
  results: ToolResultBlockParam[],
): void {
  for (const result of results) {
    messages.push({ role: "user", content: [result] });
  }
}
