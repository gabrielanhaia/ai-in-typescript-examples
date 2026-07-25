// ch10/answer.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import { retrieve, type Reranked } from "../ch09/retrieve.js";
import { contextBlock } from "./context.js";
import { ANSWER_CONTRACT, userTurn } from "./prompt.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 1024,
});

/** The generation half, on passages somebody else retrieved. */
export async function generate(
  question: string,
  hits: Reranked[],
): Promise<string> {
  const { text } = contextBlock(hits);

  const reply = await model.invoke([
    new SystemMessage(ANSWER_CONTRACT),
    new HumanMessage(userTurn(text, question)),
  ]);

  return reply.text;
}

export async function answer(question: string): Promise<string> {
  return generate(question, await retrieve(question, 5));
}
