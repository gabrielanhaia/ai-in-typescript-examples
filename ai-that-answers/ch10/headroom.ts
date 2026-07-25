import type { BaseMessage } from "@langchain/core/messages";
import { countTokens } from "./count.js";

const CONTEXT_WINDOW = 200_000;
const RESERVE_FOR_ANSWER = 2_000;

export async function fits(history: BaseMessage[]): Promise<boolean> {
  const used = await countTokens(history);
  return used + RESERVE_FOR_ANSWER <= CONTEXT_WINDOW;
}
