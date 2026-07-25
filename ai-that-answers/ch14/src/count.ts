// The only module here that bypasses the provider seam, and deliberately: token
// counting needs the provider's tokenizer, which the framework does not expose.
import Anthropic from "@anthropic-ai/sdk";
import { convertPromptToAnthropic } from "@langchain/anthropic";
import { ChatPromptValue } from "@langchain/core/prompt_values";
import type { BaseMessage } from "@langchain/core/messages";
import { MODEL, RESERVE_FOR_ANSWER } from "./config.js";

const client = new Anthropic();

export async function countTokens(
  messages: BaseMessage[],
  model = MODEL.model,
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

export async function fits(history: BaseMessage[]): Promise<boolean> {
  const used = await countTokens(history);
  return used + RESERVE_FOR_ANSWER <= MODEL.contextWindow;
}
