import type { AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { MODEL } from "./config.js";

export interface Rates {
  /** US dollars per million input tokens. */
  input: number;
  /** US dollars per million output tokens. */
  output: number;
  /** Per million tokens written to a 5-minute cache. */
  cacheWrite5m: number;
  /** Per million tokens served from cache. */
  cacheRead: number;
}

/** Published rates, checked against the provider's pricing page. */
export const RATES_VERIFIED_ON = "2026-07-25";

export const RATES: Record<string, Rates> = {
  "claude-haiku-4-5": {
    input: 1.0,
    output: 5.0,
    cacheWrite5m: 1.25,
    cacheRead: 0.1,
  },
  "claude-sonnet-5": {
    input: 2.0,
    output: 10.0,
    cacheWrite5m: 2.5,
    cacheRead: 0.2,
  },
  "claude-opus-5": {
    input: 5.0,
    output: 25.0,
    cacheWrite5m: 6.25,
    cacheRead: 0.5,
  },
};

const PER_MILLION = 1_000_000;

export function costOf(message: AIMessage | AIMessageChunk): number {
  const rates = RATES[MODEL.model];
  if (rates === undefined) {
    throw new Error(`No rates recorded for ${MODEL.model}`);
  }

  const usage = message.usage_metadata;
  if (usage === undefined) return 0;

  const details = usage.input_token_details ?? {};

  return (
    (usage.input_tokens / PER_MILLION) * rates.input +
    (usage.output_tokens / PER_MILLION) * rates.output +
    ((details.cache_read ?? 0) / PER_MILLION) * rates.cacheRead +
    ((details.cache_creation ?? 0) / PER_MILLION) * rates.cacheWrite5m
  );
}
