// ch02/state.ts
import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const PlanState = new StateSchema({
  // Everything the customer and the assistant have said.
  messages: MessagesValue,
  // The ordered step names the planner decided on. Not "plan":
  // a node in this graph already has that name.
  steps: z.array(z.string()).default(() => []),
});

// The two types every node in this graph is written against.
export type State = typeof PlanState.State;
export type Update = typeof PlanState.Update;
