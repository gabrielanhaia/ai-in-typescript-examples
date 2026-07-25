import { SystemMessage, type BaseMessage } from "langchain";
import { INPUT_BUDGET, WINDOW_TURNS } from "./config.js";
import { SYSTEM_PROMPT } from "./prompt/system.js";

export function newConversation(): BaseMessage[] {
  return [new SystemMessage(SYSTEM_PROMPT)];
}

export function slidingWindow(
  history: BaseMessage[],
  turns: number,
): BaseMessage[] {
  const [system, ...rest] = history;
  return [system, ...rest.slice(-turns * 2)];
}

/**
 * The check runs on a measurement rather than a guess, and it happens after the
 * turn — so the budget is a ceiling you approach, not a limit you crash into.
 */
export function trimIfOverBudget(
  history: BaseMessage[],
  inputTokensUsed: number,
): BaseMessage[] {
  if (inputTokensUsed > INPUT_BUDGET) {
    return slidingWindow(history, WINDOW_TURNS);
  }
  return history;
}
