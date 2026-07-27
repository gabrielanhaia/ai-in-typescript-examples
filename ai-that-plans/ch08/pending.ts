// ch08/pending.ts
import type { Proposal } from "./approval.js";
import type { buildGraph } from "./graph.js";

/** One thread's open approval, read from the checkpointer rather
 *  than from anything the paused process kept in memory. */
export async function pendingFor(
  graph: ReturnType<typeof buildGraph>,
  threadId: string,
) {
  const config = { configurable: { thread_id: threadId } };
  const snapshot = await graph.getState(config);
  const task = snapshot.tasks.find((t) => t.interrupts.length > 0);
  if (task === undefined) return null;

  return {
    threadId,
    node: task.name,
    interruptId: task.interrupts[0].id,
    proposal: task.interrupts[0].value as Proposal,
    waitingSince: snapshot.createdAt,
  };
}
