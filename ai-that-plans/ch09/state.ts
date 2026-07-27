// NOT A LISTING FROM THE BOOK.
//
// The state this chapter's graph streams. The book imports it — ch09/progress.ts
// opens with `import { PlanState } from "./state.js";` — and prints chapter 3's
// version of it rather than this one, so what is here is the smallest schema
// the chapter's printed listings actually require:
//
//   messages  every listing starts a run with `{ messages: [{ role: "user" … }] }`
//   cursor    ch09/progress.ts writes `state.cursor + 1`; ch09/events.ts reads
//             `at.values.cursor` and puts it in the `snapshot` frame
//   results   ch09/progress.ts writes `{ find_parts: found.join(", ") }`
//
// Chapter 3's `plan` and `signal` channels are left out because nothing in this
// chapter touches them.
import { MessagesValue, ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const PlanState = new StateSchema({
  // The transcript, which only ever grows. That growth is the whole of the
  // chapter's argument about what a `values` frame costs late in a run.
  messages: MessagesValue,

  // How far through the six steps the run has got. The `snapshot` frame a
  // reconnecting browser receives is this number.
  cursor: z.number().default(0),

  // One line of text per finished step, merged by key rather than replaced,
  // so a step never erases the step before it.
  results: new ReducedValue(
    z.record(z.string(), z.string()).default(() => ({})),
    {
      inputSchema: z.record(z.string(), z.string()),
      reducer: (current, next) => ({ ...current, ...next }),
    },
  ),
});

export type State = typeof PlanState.State;
export type Update = typeof PlanState.Update;
