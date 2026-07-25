export interface Rates {
  /** US dollars per million input tokens. */
  input: number;
  /** US dollars per million output tokens. */
  output: number;
  /** Per million tokens written to a 5-minute cache. */
  cacheWrite5m: number;
  /** Per million tokens written to a 1-hour cache. */
  cacheWrite1h: number;
  /** Per million tokens served from cache. */
  cacheRead: number;
}

/** Published rates, checked against the provider's pricing page. */
export const VERIFIED_ON = "2026-07-25";

export const RATES: Record<string, Rates> = {
  "claude-haiku-4-5": {
    input: 1.0,
    output: 5.0,
    cacheWrite5m: 1.25,
    cacheWrite1h: 2.0,
    cacheRead: 0.1,
  },
  "claude-sonnet-5": {
    input: 2.0,
    output: 10.0,
    cacheWrite5m: 2.5,
    cacheWrite1h: 4.0,
    cacheRead: 0.2,
  },
  "claude-opus-5": {
    input: 5.0,
    output: 25.0,
    cacheWrite5m: 6.25,
    cacheWrite1h: 10.0,
    cacheRead: 0.5,
  },
};
