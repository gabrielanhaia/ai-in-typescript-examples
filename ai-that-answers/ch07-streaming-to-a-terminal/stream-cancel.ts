import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 2048,
});

const messages = [
  new SystemMessage("Explain plainly. No lists."),
  new HumanMessage("Explain the whole TCP handshake in detail."),
];

const controller = new AbortController();

process.on("SIGINT", () => {
  controller.abort();
});

try {
  const stream = await model.stream(messages, {
    signal: controller.signal,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.text);
  }
} catch (error) {
  if (controller.signal.aborted) {
    process.stdout.write("\n[cancelled]\n");
  } else {
    throw error;
  }
}
