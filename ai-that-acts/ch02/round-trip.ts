// PRINTED IN CHAPTER 2 as `ch02/round-trip.ts`.
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { getOrderStatus, lookUpOrder } from "./tool.js";

const client = new Anthropic();

const messages: MessageParam[] = [
  { role: "user", content: "Where is order ORD-4471?" },
];

const first = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 8192,
  tools: [getOrderStatus],
  messages,
});

if (first.stop_reason !== "tool_use") {
  throw new Error(`expected a tool call, got ${first.stop_reason}`);
}

messages.push({ role: "assistant", content: first.content });

const call = first.content.find((block) => block.type === "tool_use");
if (!call) throw new Error("stop_reason said tool_use, but no block");

const result = lookUpOrder(call.input as { order_id: string });

messages.push({
  role: "user",
  content: [
    {
      type: "tool_result",
      tool_use_id: call.id,
      content: JSON.stringify(result),
    },
  ],
});

const second = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 8192,
  tools: [getOrderStatus],
  messages,
});

for (const block of second.content) {
  if (block.type === "text") console.log(block.text);
}
