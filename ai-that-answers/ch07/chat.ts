import * as readline from "node:readline/promises";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage, SystemMessage } from "langchain";
import type {
  AIMessageChunk,
  BaseMessage,
} from "@langchain/core/messages";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

const history: BaseMessage[] = [
  new SystemMessage("Explain plainly. No lists."),
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

for (;;) {
  const input = await rl.question("\nyou> ");
  if (input.trim() === "") break;

  history.push(new HumanMessage(input));

  const controller = new AbortController();
  const interrupt = () => controller.abort();
  rl.on("SIGINT", interrupt);

  let final: AIMessageChunk | undefined;
  process.stdout.write("\nbot> ");

  try {
    const stream = await model.stream(history, {
      signal: controller.signal,
    });
    for await (const chunk of stream) {
      process.stdout.write(chunk.text);
      final = final === undefined ? chunk : final.concat(chunk);
    }
  } catch (error) {
    if (!controller.signal.aborted) throw error;
    process.stdout.write(" [stopped]");
  } finally {
    rl.off("SIGINT", interrupt);
  }

  if (final !== undefined) {
    history.push(new AIMessage({ content: final.text }));
  }
  process.stdout.write("\n");
}

rl.close();
