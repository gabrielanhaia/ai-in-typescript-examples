import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 300,
});

const answer = await model.invoke([
  new SystemMessage("Answer in one short paragraph. No lists."),
  new HumanMessage("What is a monorepo?"),
]);

console.log(answer.text);
