import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 400,
});

const answer = await model.invoke([
  new SystemMessage("Answer in two sentences. No lists, no preamble."),
  new HumanMessage("What is a monorepo, and when is it the wrong choice?"),
]);

console.log(answer.text);
