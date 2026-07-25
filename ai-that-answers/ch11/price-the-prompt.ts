import { SystemMessage } from "langchain";
import { countTokens } from "./count.js";
import { RATES } from "./rates.js";

export async function pricePrefix(
  prompt: string,
  turnsPerConversation: number,
  conversationsPerDay: number,
  model: string,
): Promise<number> {
  const rates = RATES[model];
  if (rates === undefined) throw new Error(`No rates for ${model}`);

  const tokens = await countTokens([new SystemMessage(prompt)]);
  const perDay = tokens * turnsPerConversation * conversationsPerDay;
  return (perDay / 1_000_000) * rates.input * 365;
}
