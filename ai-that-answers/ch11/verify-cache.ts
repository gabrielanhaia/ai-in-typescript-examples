// A cache miss looks exactly like a cache hit from the outside: same response,
// same latency band, no warning. Two identical calls, with cache_creation and
// cache_read printed, is the only way to confirm one.
//
// The prefix here is well under claude-haiku-4-5's 4,096-token minimum, so
// expect zeros. That is the failure mode this script exists to make visible.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import { SYSTEM_PROMPT } from "../ch04/prompt/system.js";
import { spendOf } from "./usage.js";
import { costOf } from "./cost.js";

const MODEL = "claude-haiku-4-5";

const model = new ChatAnthropic({
  model: MODEL,
  maxTokens: 256,
});

const messages = [
  new SystemMessage(SYSTEM_PROMPT),
  new HumanMessage("My rear brake feels spongy. What should I look at first?"),
];

const options = { cache_control: { type: "ephemeral" as const } };

const first = await model.invoke(messages, options);
const second = await model.invoke(messages, options);

for (const [label, reply] of [
  ["first ", first],
  ["second", second],
] as const) {
  const spend = spendOf(reply);
  console.log(
    `${label}  uncached ${spend.input}  written ${spend.cacheWrite}  ` +
      `read ${spend.cacheRead}  $${costOf(spend, MODEL).toFixed(6)}`,
  );
}
