// ch03/narrow.ts
import { StateGraph, StateSchema } from "@langchain/langgraph";
import { PlanState } from "./state.js";

// The planner is allowed to see two channels and no more.
export const PlannerInput = new StateSchema({
  messages: PlanState.fields.messages,
  results: PlanState.fields.results,
});

export const builder = new StateGraph(PlanState).addNode(
  "planner",
  (state: typeof PlannerInput.State) => {
    // There is no cursor here to read, so this node cannot plan
    // around one, and no future edit can make it start.
    const asked = state.messages[0].text;
    return { plan: [{ tool: "lookup_order", why: asked }] };
  },
  { input: PlannerInput },
);
