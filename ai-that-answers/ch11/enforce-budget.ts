// budget.ts feeding chapter 3's trim, so the threshold is derived from money
// rather than picked.
import type { BaseMessage } from "langchain";
import { slidingWindow } from "../ch03/sliding-window.js";
import { inputBudgetPerTurn } from "./budget.js";

const MODEL = "claude-haiku-4-5";

export const INPUT_BUDGET = inputBudgetPerTurn(0.01, 20, 150, MODEL);

export function trimIfOverBudget(
  history: BaseMessage[],
  inputTokens: number,
): BaseMessage[] {
  if (inputTokens > INPUT_BUDGET) {
    return slidingWindow(history, 6);
  }
  return history;
}
