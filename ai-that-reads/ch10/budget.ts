// ch10/budget.ts
import Anthropic from "@anthropic-ai/sdk";
import { convertPromptToAnthropic } from "@langchain/anthropic";
import { ChatPromptValue } from "@langchain/core/prompt_values";
import { HumanMessage, SystemMessage } from "langchain";

const client = new Anthropic();

export const ANSWERING_MODEL = "claude-sonnet-5";

export async function countPromptTokens(
  systemText: string,
  userText: string,
): Promise<number> {
  const { system, messages } = convertPromptToAnthropic(
    new ChatPromptValue([
      new SystemMessage(systemText),
      new HumanMessage(userText),
    ]),
  );

  const counted = await client.messages.countTokens({
    model: ANSWERING_MODEL,
    system,
    messages,
  });

  return counted.input_tokens;
}
