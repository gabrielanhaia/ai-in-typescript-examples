// Size maxTokens from measurement instead of instinct: run chapter 6's fixed
// input set, record output_tokens per answer, sort, and look at the high end.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import { inputs } from "../ch06-prompt-technique/inputs.js";
import { BASELINE } from "../ch06-prompt-technique/variants.js";

const SYSTEM_PROMPT = BASELINE.system;

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

const outputs: number[] = [];

for (const input of inputs) {
  const reply = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(input),
  ]);
  outputs.push(reply.usage_metadata?.output_tokens ?? 0);
}

outputs.sort((a, b) => a - b);
const p95 = outputs[Math.floor(outputs.length * 0.95)] ?? 0;
console.log(`max observed ${outputs.at(-1)}, p95 ${p95}`);
