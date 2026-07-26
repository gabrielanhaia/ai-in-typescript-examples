// PRINTED IN CHAPTER 7 as `ch07/result.ts`.
import type { ToolResultBlockParam }
  from "@anthropic-ai/sdk/resources/messages";

export function ok(id: string, text: string): ToolResultBlockParam {
  return { type: "tool_result", tool_use_id: id, content: text };
}

/** `is_error` marks the result. `content` is what the model reads,
 *  so it is written for a reader, not for a log file. */
export function failed(id: string, text: string): ToolResultBlockParam {
  return {
    type: "tool_result",
    tool_use_id: id,
    content: text,
    is_error: true,
  };
}
