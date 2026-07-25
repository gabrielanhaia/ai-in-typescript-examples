// Counts a request, sends it, and prints the two figures side by side. Use the
// difference to choose the margin in headroom.ts.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, type BaseMessage } from "langchain";
import { countTokens } from "./count.js";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 256,
});

const history: BaseMessage[] = [
  new SystemMessage("You are a concise assistant. Two sentences at most."),
  new HumanMessage("What is a monorepo, and when is it the wrong choice?"),
];

const predicted = await countTokens(history);
const answer = await model.invoke(history);
console.log(predicted, "predicted /", answer.usage_metadata?.input_tokens, "billed");
