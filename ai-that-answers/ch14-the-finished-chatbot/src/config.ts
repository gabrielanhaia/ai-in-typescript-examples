export interface ModelConfig {
  readonly provider: string;
  readonly model: string;
  readonly contextWindow: number;
  readonly maxOutputTokens: number;
  readonly minCacheablePrefix: number;
  readonly acceptsSampling: boolean;
}

export const MODEL: ModelConfig = {
  provider: "anthropic",
  model: "claude-haiku-4-5",
  contextWindow: 200_000,
  maxOutputTokens: 64_000,
  minCacheablePrefix: 4_096,
  acceptsSampling: true,
};

export const SAMPLING: Record<string, number> = { temperature: 0 };

export const ANSWER_TOKENS = 1_024;
export const RESERVE_FOR_ANSWER = 2_000;
export const INPUT_BUDGET = 8_000;
export const WINDOW_TURNS = 6;

export const INTERACTIVE = {
  maxRetries: 2,
  maxConcurrency: 4,
  timeoutMs: 30_000,
  firstTokenMs: 15_000,
  idleMs: 10_000,
} as const;
