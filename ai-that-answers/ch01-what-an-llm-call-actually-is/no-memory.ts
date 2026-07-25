// The illusion of memory, in about four lines: there is no memory, there is an
// array and history.push. The model sees the whole array on every call.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, type BaseMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 300,
});

const instructions = "Answer in one short paragraph. No lists.";
const userInput = "What is a monorepo?";

const history: BaseMessage[] = [new SystemMessage(instructions)];

history.push(new HumanMessage(userInput));
const answer = await model.invoke(history);
history.push(answer);

console.log(answer.text);
console.log(`\n[history is now ${history.length} messages long]`);
