import * as readline from "node:readline/promises";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, type BaseMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 600,
});

const history: BaseMessage[] = [
  new SystemMessage("You are a concise assistant. Two sentences at most."),
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let turn = 0;

while (true) {
  const line = (await rl.question("\nyou> ")).trim();
  if (line === "" || line === "/quit") break;

  history.push(new HumanMessage(line));
  const sent = history.length;
  const answer = await model.invoke(history);
  history.push(answer);

  turn += 1;
  const usage = answer.usage_metadata;
  console.log(`\nai> ${answer.text}`);
  if (usage !== undefined) {
    console.log(
      `   [turn ${turn} | ${sent} messages sent | ` +
        `${usage.input_tokens} in / ${usage.output_tokens} out]`,
    );
  }
}

rl.close();
