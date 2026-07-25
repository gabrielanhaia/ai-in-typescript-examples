import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import { SYSTEM_PROMPT } from "./prompt/system.js";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

export async function ask(question: string): Promise<string> {
  const reply = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(question),
  ]);
  return reply.text;
}

// Varying context belongs in the first user turn, never interpolated into
// SYSTEM_PROMPT: the system block must be the same bytes on every request.
export function openConversation(bike: string): HumanMessage {
  return new HumanMessage(
    `Context for this conversation: the customer rides a ${bike}. ` +
      `Do not mention this context unless it is relevant to the answer.`,
  );
}
