import Anthropic from "@anthropic-ai/sdk";
import { convertPromptToAnthropic } from "@langchain/anthropic";
import { ChatPromptValue } from "@langchain/core/prompt_values";
import type { BaseMessage } from "@langchain/core/messages";

const client = new Anthropic();

export async function countTokens(
  messages: BaseMessage[],
  model = "claude-haiku-4-5",
): Promise<number> {
  const { system, messages: converted } = convertPromptToAnthropic(
    new ChatPromptValue(messages),
  );

  const counted = await client.messages.countTokens({
    model,
    system,
    messages: converted,
  });

  return counted.input_tokens;
}
