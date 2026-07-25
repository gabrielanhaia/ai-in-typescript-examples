export interface BackoffOptions {
  attempts: number;
  baseMs: number;
  capMs: number;
}

export function delayFor(attempt: number, o: BackoffOptions): number {
  const exponential = Math.min(o.baseMs * 2 ** attempt, o.capMs);
  return Math.round(exponential * (0.5 + Math.random() * 0.5));
}

export async function withRetry<T>(
  call: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
  o: BackoffOptions,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      if (!shouldRetry(error) || attempt >= o.attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, delayFor(attempt, o)));
    }
  }
}
