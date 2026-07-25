// Prompt caching switched on. At the pinned version it is a call option rather
// than a constructor option, and the top-level flag form lets the binding decide
// where the cache marker goes.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, type BaseMessage } from "langchain";
import { SYSTEM_PROMPT } from "../ch04-the-system-prompt/prompt/system.js";
import { spendOf } from "./usage.js";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 512,
});

const history: BaseMessage[] = [
  new SystemMessage(SYSTEM_PROMPT),
  new HumanMessage("My rear brake feels spongy. What should I look at first?"),
];

const answer = await model.invoke(history, {
  cache_control: { type: "ephemeral" },
});

// For the one-hour variant:
//   const answer = await model.invoke(history, {
//     cache_control: { type: "ephemeral", ttl: "1h" },
//   });

console.log(answer.text);
console.log(spendOf(answer));
