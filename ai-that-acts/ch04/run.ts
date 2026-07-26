// PRINTED IN CHAPTER 4 as `ch04/run.ts`, with the per-step usage line from
// "Watching the array grow" added at the end, which is where the chapter puts
// it.
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { runAgent } from "./loop.js";
import { trace } from "./trace.js";

const task = process.argv[2] ?? "Where is order ORD-4471?";
const messages: MessageParam[] = [{ role: "user", content: task }];

const { reply, step } = await runAgent(messages);

for (const block of reply.content) {
  if (block.type === "text") console.log(block.text);
}
console.log(
  `\n[${step} step(s), ${messages.length} messages in history]`,
);

console.log(
  `step ${step}: ${messages.length} messages, ` +
    `${reply.usage.input_tokens} in / ${reply.usage.output_tokens} out`,
);

// Not printed: `--trace` prints the transcript the chapter reads by hand.
if (process.argv.includes("--trace")) trace(messages);
