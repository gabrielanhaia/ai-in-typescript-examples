// PRINTED IN CHAPTER 6 as `ch06/context.ts`.
export interface ToolContext {
  /** Whose conversation this is. Read from the request that started
   *  the run, never from a tool argument. */
  readonly customerId: string;
  /** Scoped to that customer, short-lived, read-only unless the tool
   *  it is handed to needs otherwise. */
  readonly token: string;
  /** Aborted when the run ends, for any reason (chapter 9). */
  readonly signal: AbortSignal;
}
