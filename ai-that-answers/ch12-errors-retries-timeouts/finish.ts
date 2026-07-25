import type { AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { stopReason } from "../ch07-streaming-to-a-terminal/stop-reason.js";

export type Finish =
  | { kind: "complete"; text: string }
  | { kind: "truncated"; text: string; cause: "output_cap" | "context_window" }
  | { kind: "refused"; category: string | null }
  | { kind: "unknown"; text: string; reason: string };

/**
 * Returns response_metadata.stop_details.category, or null if it is not there.
 * Streamed responses land in the null branch at the pinned version: the
 * assembled chunk has stop_reason on it and no stop_details.
 */
function refusalCategory(message: AIMessage | AIMessageChunk): string | null {
  const details: unknown = message.response_metadata["stop_details"];
  if (typeof details !== "object" || details === null) return null;
  const category: unknown = (details as Record<string, unknown>)["category"];
  return typeof category === "string" ? category : null;
}

export function finishOf(message: AIMessage | AIMessageChunk): Finish {
  const reason = stopReason(message) ?? "end_turn";
  const text = message.text;

  switch (reason) {
    case "end_turn":
    case "stop_sequence":
      return { kind: "complete", text };
    case "max_tokens":
      return { kind: "truncated", text, cause: "output_cap" };
    case "model_context_window_exceeded":
      return { kind: "truncated", text, cause: "context_window" };
    case "refusal":
      return { kind: "refused", category: refusalCategory(message) };
    default:
      return { kind: "unknown", text, reason };
  }
}
