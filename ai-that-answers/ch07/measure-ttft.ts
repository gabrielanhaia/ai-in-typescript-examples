import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

const messages = [
  new SystemMessage("Explain plainly. No lists."),
  new HumanMessage("Why is HTTP/2 faster than HTTP/1.1?"),
];

const started = performance.now();
let firstTokenAt: number | undefined;
let characters = 0;

const stream = await model.stream(messages);

for await (const chunk of stream) {
  if (chunk.text.length > 0 && firstTokenAt === undefined) {
    firstTokenAt = performance.now();
  }
  characters += chunk.text.length;
}

const finishedAt = performance.now();
const ttft = (firstTokenAt ?? finishedAt) - started;

console.log("ttft   ", Math.round(ttft), "ms");
console.log("total  ", Math.round(finishedAt - started), "ms");
console.log("chars  ", characters);
