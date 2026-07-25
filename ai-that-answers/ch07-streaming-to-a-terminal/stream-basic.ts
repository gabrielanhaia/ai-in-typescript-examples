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

const stream = await model.stream(messages);

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}

process.stdout.write("\n");
