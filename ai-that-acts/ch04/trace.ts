// PRINTED IN CHAPTER 4 as `ch04/trace.ts`.
//
// Fifteen lines, and the single most useful debugging tool in the book.
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export function trace(messages: MessageParam[]): void {
  messages.forEach((message, i) => {
    const blocks =
      typeof message.content === "string"
        ? ["text"]
        : message.content.map((block) =>
            block.type === "tool_use"
              ? `tool_use(${block.name})`
              : block.type === "tool_result"
                ? `tool_result(${block.is_error ? "error" : "ok"})`
                : block.type,
          );
    console.log(`${i} ${message.role.padEnd(9)} ${blocks.join(", ")}`);
  });
}
