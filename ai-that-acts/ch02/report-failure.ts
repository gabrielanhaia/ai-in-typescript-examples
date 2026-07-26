// The block printed in chapter 2 under "When the function throws" — the
// catch that turns an exception into a tool result. The chapter prints it
// without a filename; it is wrapped in a function here so that the same
// lines type-check against a real message array.
import type {
  MessageParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { lookUpOrder } from "./tool.js";

export function reportFailure(
  call: ToolUseBlock,
  messages: MessageParam[],
): void {
  let result: string;
  let failed = false;
  try {
    result = JSON.stringify(
      lookUpOrder(call.input as { order_id: string }),
    );
  } catch (error) {
    result = error instanceof Error ? error.message : String(error);
    failed = true;
  }

  messages.push({
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: call.id,
        content: result,
        is_error: failed,
      },
    ],
  });
}
