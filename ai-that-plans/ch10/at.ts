// ch10/at.ts
import type { StateSnapshot } from "@langchain/langgraph";
import type { buildGraph } from "./graph.js";

/** There is no read-the-checkpoint-at-step-N call, so this is it.
 *  After a fork two checkpoints can share a step number, and the
 *  history runs newest first, so this returns the later one. */
export async function snapshotAtStep(
  graph: ReturnType<typeof buildGraph>,
  threadId: string,
  step: number,
): Promise<StateSnapshot> {
  const config = { configurable: { thread_id: threadId } };
  for await (const snap of graph.getStateHistory(config)) {
    if (snap.metadata?.step === step) return snap;
  }
  throw new Error(`No checkpoint at step ${step} on ${threadId}`);
}
