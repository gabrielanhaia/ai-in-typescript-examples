// chat.ts with the two corrections the chapter makes to it:
//   1. mutate the history only on success, so a thrown call cannot leave a
//      question in the array with no answer behind it;
//   2. trim against a measured token budget at the end of each turn, rather
//      than against a turn count that means nothing in isolation.
import * as readline from "node:readline/promises";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, type BaseMessage } from "langchain";
import { slidingWindow } from "./sliding-window.js";

const INPUT_BUDGET = 8_000;

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 600,
});

let history: BaseMessage[] = [
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

  const asked = new HumanMessage(line);
  const answer = await model.invoke([...history, asked]);
  history.push(asked, answer);

  turn += 1;
  console.log(`\nai> ${answer.text}`);

  const used = answer.usage_metadata?.input_tokens ?? 0;
  console.log(`   [turn ${turn} | ${used} input tokens]`);

  if (used > INPUT_BUDGET) {
    history = slidingWindow(history, 6);
    console.log(`   [over ${INPUT_BUDGET}; trimmed to ${history.length} messages]`);
  }
}

rl.close();
