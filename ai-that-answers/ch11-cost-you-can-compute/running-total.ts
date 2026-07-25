// The chat loop with the accounting attached: per-turn cost and the running
// conversation total, both on standard error so the answer stays pipeable.
import * as readline from "node:readline/promises";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, type BaseMessage } from "langchain";
import { costOf } from "./cost.js";
import { spendOf } from "./usage.js";

const MODEL = "claude-haiku-4-5";

const model = new ChatAnthropic({
  model: MODEL,
  maxTokens: 600,
});

const history: BaseMessage[] = [
  new SystemMessage("You are a concise assistant. Two sentences at most."),
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversationCost = 0;
let turn = 0;

for (;;) {
  const line = (await rl.question("\nyou> ")).trim();
  if (line === "" || line === "/quit") break;

  const asked = new HumanMessage(line);
  const answer = await model.invoke([...history, asked]);
  history.push(asked, answer);

  console.log(`\nai> ${answer.text}`);

  const spend = spendOf(answer);
  const turnCost = costOf(spend, MODEL);
  conversationCost += turnCost;
  turn += 1;

  console.error(
    `[turn ${turn}] ${spend.input} in / ${spend.output} out ` +
      `= $${turnCost.toFixed(6)}  (conversation $${conversationCost.toFixed(4)})`,
  );
}

rl.close();
