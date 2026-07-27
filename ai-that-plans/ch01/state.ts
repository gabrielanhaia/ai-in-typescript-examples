// PRINTED IN CHAPTER 1, in full, under "What to write down". Nothing is added
// to this file: the chapter's whole argument about state is that this shape is
// the design, and that a `currentStep` field would be a second source of truth.
// ch01/state.ts
/** Everything a second process needs to carry this run onward. */
export interface RunState {
  /** Stable across restarts: the key the state is filed under. */
  readonly runId: string;
  /** The customer's words, verbatim. A re-plan needs the
   *  original, not a summary of it. */
  readonly task: string;
  /** Ordered step names, decided once. */
  plan: string[];
  /** Completed steps, in order. Its length is the cursor. */
  done: { step: string; result: string }[];
  updatedAt: string;
}
