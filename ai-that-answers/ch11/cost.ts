import { RATES } from "./rates.js";
import type { Spend } from "./usage.js";

const PER_MILLION = 1_000_000;

export function costOf(spend: Spend, model: string): number {
  const rates = RATES[model];
  if (rates === undefined) {
    throw new Error(`No rates recorded for ${model}`);
  }

  return (
    (spend.input / PER_MILLION) * rates.input +
    (spend.output / PER_MILLION) * rates.output +
    (spend.cacheRead / PER_MILLION) * rates.cacheRead +
    (spend.cacheWrite / PER_MILLION) * rates.cacheWrite5m
  );
}
