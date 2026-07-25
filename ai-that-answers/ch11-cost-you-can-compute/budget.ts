import { RATES } from "./rates.js";

const PER_MILLION = 1_000_000;

export function inputBudgetPerTurn(
  targetConversationCost: number,
  expectedTurns: number,
  averageOutputTokens: number,
  model: string,
): number {
  const rates = RATES[model];
  if (rates === undefined) throw new Error(`No rates for ${model}`);

  const outputCost =
    ((averageOutputTokens * expectedTurns) / PER_MILLION) * rates.output;
  const inputAllowance = targetConversationCost - outputCost;

  if (inputAllowance <= 0) return 0;

  return (inputAllowance / rates.input / expectedTurns) * PER_MILLION;
}
