export const INTERACTIVE = {
  maxRetries: 2,
  maxConcurrency: 4,
  timeoutMs: 30_000,
  firstTokenMs: 15_000,
  idleMs: 10_000,
} as const;

export const BATCH = {
  maxRetries: 5,
  maxConcurrency: 2,
  timeoutMs: 120_000,
  firstTokenMs: 60_000,
  idleMs: 30_000,
} as const;
