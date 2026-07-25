import type { AIMessage } from "@langchain/core/messages";

export interface Spend {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export function spendOf(message: AIMessage): Spend {
  const usage = message.usage_metadata;
  if (usage === undefined) {
    return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  }

  const details = usage.input_token_details ?? {};
  return {
    input: usage.input_tokens,
    output: usage.output_tokens,
    cacheRead: details.cache_read ?? 0,
    cacheWrite: details.cache_creation ?? 0,
  };
}
