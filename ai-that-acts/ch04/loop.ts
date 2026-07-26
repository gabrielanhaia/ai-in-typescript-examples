// PRINTED IN CHAPTER 4 as `ch04/loop.ts`.
//
// Thirty lines, counted as printed, and two of them are blank.
import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { definitions, execute } from "../ch03/toolbox.js";

const client = new Anthropic();

export async function runAgent(messages: MessageParam[], maxSteps = 8) {
  for (let step = 1; step <= maxSteps; step += 1) {
    const reply = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8192,
      tools: definitions,
      messages,
    });
    if (reply.stop_reason !== "tool_use") return { reply, step };
    messages.push({ role: "assistant", content: reply.content });
    const calls = reply.content.filter((b) => b.type === "tool_use");
    const results = await Promise.all(
      calls.map(async (call): Promise<ToolResultBlockParam> => {
        const outcome = await execute(call);
        return { type: "tool_result", tool_use_id: call.id, ...outcome };
      }),
    );
    messages.push({ role: "user", content: results });
  }
  throw new Error(`step cap of ${maxSteps} reached`);
}
