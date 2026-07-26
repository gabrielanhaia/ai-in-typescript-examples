// PRINTED IN CHAPTER 9 as `ch09/limits.ts`.
//
// The `Stop` union is not printed. The chapter says `exceeded` returns "a
// `Stop` describing which ceiling tripped, not a boolean", and names all five
// kinds; this is that sentence as a type.
import type { Usage } from "@anthropic-ai/sdk/resources/messages";

export type Stop =
  | { kind: "cancelled" }
  | { kind: "steps"; at: number }
  | { kind: "tokens"; at: number }
  | { kind: "clock"; at: number }
  | { kind: "stalled"; tool: string };

export interface Limits {
  /** Iterations of the loop: one model call plus the tools it
   *  triggered. */
  readonly maxSteps: number;
  /** Cumulative tokens for the whole run, input and output together. */
  readonly maxTokens: number;
  /** Wall clock from the first request, in milliseconds. */
  readonly maxWallMs: number;
}

/** Somebody is waiting at the other end of this one. */
export const INTERACTIVE: Limits = {
  maxSteps: 8,
  maxTokens: 120_000,
  maxWallMs: 60_000,
};

/** The unattended profile. Note where it differs: mostly the clock.
 *  Removing the person at the other end buys patience for slow
 *  dependencies, not extra reasoning. */
export const NIGHTLY: Limits = {
  maxSteps: 12,
  maxTokens: 400_000,
  maxWallMs: 600_000,
};

export class Ledger {
  #steps = 0;
  #tokens = 0;
  readonly #from = Date.now();

  constructor(
    private readonly limits: Limits,
    private readonly signal: AbortSignal,
  ) {}

  spend(usage: Usage): void {
    this.#steps += 1;
    this.#tokens +=
      usage.input_tokens +
      usage.output_tokens +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0);
  }

  /** What the run has used so far, for the log line and the result. */
  get spent(): { steps: number; tokens: number; ms: number } {
    return {
      steps: this.#steps,
      tokens: this.#tokens,
      ms: Date.now() - this.#from,
    };
  }

  /** Checked between steps. The first ceiling to trip ends the run. */
  exceeded(): Stop | undefined {
    if (this.signal.aborted) return { kind: "cancelled" };
    if (this.#steps >= this.limits.maxSteps) {
      return { kind: "steps", at: this.#steps };
    }
    if (this.#tokens >= this.limits.maxTokens) {
      return { kind: "tokens", at: this.#tokens };
    }
    const elapsed = Date.now() - this.#from;
    if (elapsed >= this.limits.maxWallMs) {
      return { kind: "clock", at: elapsed };
    }
    return undefined;
  }
}
