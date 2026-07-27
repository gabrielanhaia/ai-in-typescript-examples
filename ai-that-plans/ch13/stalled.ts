// ch13/stalled.ts
import type { StateSnapshot } from "@langchain/langgraph";

export interface Pause {
  readonly node: string;
  readonly value: unknown;
  /** Absent only if the checkpointer stored no timestamp. */
  readonly waitingMs?: number;
}

/** A thread is stalled when the graph still has somewhere to go
 *  and the task that would go there is holding a question. */
export function pendingPause(
  latest: StateSnapshot,
  now = Date.now(),
): Pause | undefined {
  if (latest.next.length === 0) return undefined;
  for (const task of latest.tasks) {
    const [first] = task.interrupts;
    if (first === undefined) continue;
    const at = latest.createdAt;
    return {
      node: task.name,
      value: first.value,
      ...(at ? { waitingMs: now - Date.parse(at) } : {}),
    };
  }
  return undefined;
}
