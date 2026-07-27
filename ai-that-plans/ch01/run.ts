// PRINTED IN CHAPTER 1, in full, under "Where the save goes". Nothing is added:
// one `load` at the top, one `save` after every step, and no `resume()` — the
// `??` on the first statement is the entire resume story.
// ch01/run.ts
import { load, save } from "./store.js";
import { execute, plan } from "./steps.js";
import type { RunState } from "./state.js";

export async function run(
  runId: string,
  task: string,
): Promise<RunState> {
  const state: RunState = (await load(runId)) ?? {
    runId,
    task,
    plan: await plan(task),
    done: [],
    updatedAt: new Date().toISOString(),
  };
  // Save before the first step as well: a plan that cost a model
  // call and was never written down is the expensive thing to lose.
  await save(state);
  while (state.done.length < state.plan.length) {
    const step = state.plan[state.done.length];
    const result = await execute(step, state);
    state.done.push({ step, result });
    state.updatedAt = new Date().toISOString();
    await save(state);
  }
  return state;
}
