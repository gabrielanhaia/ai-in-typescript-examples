// ch03/state.ts
import {
  MessagesValue,
  ReducedValue,
  StateSchema,
  UntrackedValue,
} from "@langchain/langgraph";
import { z } from "zod";
import { PlanOnce } from "./plan-channel.js";

export const PlanState = new StateSchema({
  // The transcript. MessagesValue arrives with its reducer already
  // attached: writes append, and a message carrying a known id
  // replaces the one it matches instead of arriving twice.
  messages: MessagesValue,

  // The ordered plan. Written once; see ./plan-channel.ts.
  plan: PlanOnce,

  // How far through the plan the run has got. A plain Zod schema is
  // a last-value channel, so a write replaces.
  cursor: z.number().default(0),

  // Tool results, keyed by tool name. Merging by key is what lets
  // two nodes finish in one step without erasing each other.
  results: new ReducedValue(
    z.record(z.string(), z.string()).default(() => ({})),
    {
      inputSchema: z.record(z.string(), z.string()),
      reducer: (current, next) => ({ ...current, ...next }),
    },
  ),

  // Never checkpointed. A live handle is not a fact about the run.
  signal: new UntrackedValue<AbortSignal>(),
});

export type State = typeof PlanState.State;
export type Update = typeof PlanState.Update;
