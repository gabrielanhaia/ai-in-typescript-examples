// ch03/nodes.ts
import { PlanState } from "./state.js";

/** Read the whole state, return only the part that changed. */
export const advance: typeof PlanState.Node = (state) => {
  const next = state.cursor + 1;
  return next < state.plan.length ? { cursor: next } : {};
};

/** Record one tool's result without touching anybody else's. */
export const record: typeof PlanState.Node = (state) => {
  const step = state.plan[state.cursor];
  return step ? { results: { [step.tool]: "dispatched" } } : {};
};
