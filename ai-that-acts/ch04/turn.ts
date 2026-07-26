// PRINTED IN CHAPTER 4 as `ch04/turn.ts`.
//
// `textOf` is not printed — the chapter shows the switch and names the
// helper. It is four lines and it is here so the file compiles.
import type { Message } from "@anthropic-ai/sdk/resources/messages";

function textOf(reply: Message): string {
  return reply.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export type Turn =
  | { kind: "answer"; text: string }
  | { kind: "truncated"; why: "max_tokens" | "context_window" }
  | { kind: "refused" }
  | { kind: "resume" }
  | { kind: "in_flight" }
  | { kind: "unknown"; stopReason: string };

export function classify(reply: Message): Turn {
  switch (reply.stop_reason) {
    case "end_turn":
    case "stop_sequence":
      return { kind: "answer", text: textOf(reply) };
    case "max_tokens":
      return { kind: "truncated", why: "max_tokens" };
    case "model_context_window_exceeded":
      return { kind: "truncated", why: "context_window" };
    case "refusal":
      return { kind: "refused" };
    case "pause_turn":
      return { kind: "resume" };
    case "tool_use":
      return { kind: "unknown", stopReason: "tool_use" };
    case null:
      return { kind: "in_flight" };
    default:
      return { kind: "unknown", stopReason: reply.stop_reason };
  }
}
