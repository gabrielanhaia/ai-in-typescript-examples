import type { AIMessage, AIMessageChunk } from "@langchain/core/messages";

// Chapter 7 prints this taking an AIMessageChunk. Chapter 12 reuses it on a
// buffered response and tells you to widen the parameter first, because
// AIMessage is not assignable to AIMessageChunk. The body is unchanged.
export function stopReason(
  message: AIMessage | AIMessageChunk,
): string | undefined {
  const value =
    message.additional_kwargs.stop_reason ??
    message.response_metadata.stop_reason;
  return typeof value === "string" ? value : undefined;
}
