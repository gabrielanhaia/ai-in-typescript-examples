import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import type { AIMessageChunk } from "@langchain/core/messages";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

const messages = [
  new SystemMessage("Explain plainly. No lists."),
  new HumanMessage("Why is HTTP/2 faster than HTTP/1.1?"),
];

const stream = await model.stream(messages);

let final: AIMessageChunk | undefined;

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
  final = final === undefined ? chunk : final.concat(chunk);
}

process.stdout.write("\n");

if (final !== undefined) {
  console.log("id:     ", final.id);
  console.log("tokens: ", final.usage_metadata);
  console.log("text:   ", final.text.length, "characters");
}
