// ch03/reset.ts
import { Overwrite } from "@langchain/langgraph";
import { PlanState } from "./state.js";

/** Throw away every result so far, on a channel that accumulates. */
export const startOver: typeof PlanState.Node = () => ({
  results: new Overwrite({}),
  cursor: 0,
});
