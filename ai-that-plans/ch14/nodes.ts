// ch14/nodes.ts
import { AIMessage } from "@langchain/core/messages";
import { isPartsStep, runStep } from "./shop.js";
import type { Job, JobUpdate } from "./state.js";

/** The four steps the parent owns. One call, no decisions. */
export async function execute(state: Job): Promise<JobUpdate> {
  const step = state.steps[state.cursor];
  const result = await runStep(step, state);
  return {
    results: { [step]: result },
    messages: [new AIMessage(`${step}: ${result}`)],
  };
}

/** Where the specialist's prose becomes the parent's state. One
 *  report covers every parts step the plan asked for. */
export function collect(state: Job): JobUpdate {
  const report = String(state.messages.at(-1)?.text ?? "");
  const covered = state.steps.filter(isPartsStep);
  return {
    results: Object.fromEntries(covered.map((s) => [s, report])),
  };
}

/** The only place the cursor moves: forward to the first step
 *  nothing has recorded a result for. Idempotent, so a resumed
 *  run lands where a fresh one would. */
export function advance(state: Job): JobUpdate {
  const done = (i: number) =>
    Object.hasOwn(state.results, state.steps[i]);
  let at = state.cursor;
  while (at < state.steps.length && done(at)) at += 1;
  return { cursor: at };
}
