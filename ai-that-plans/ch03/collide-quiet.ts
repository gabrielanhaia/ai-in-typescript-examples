// NOT A LISTING FROM THE BOOK.
//
// The chapter's first experiment, second half: "give `cursor` a reducer that
// keeps the last write — `(current, next) => next` — and run it again. It
// passes. Run it ten more times and see whether it always gives you the same
// answer."
//
// It does, here, which is the whole point. The two nodes are trivial and the
// scheduler runs them in the order they were added, so this machine prints
// the same number ten times out of ten. Put a network call in each branch and
// the number becomes whichever supplier answered second.
//
// Same graph as ./collide.ts. Only the channel changed. No key needed.
import {
  END,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import { z } from "zod";
import { PlanState } from "./state.js";

// The channels are reused by reference; only `cursor` is replaced.
const QuietState = new StateSchema({
  ...PlanState.fields,
  cursor: new ReducedValue(
    z.number().default(0),
    {
      inputSchema: z.number(),
      reducer: (_current, next) => next,
    },
  ),
});

const graph = new StateGraph(QuietState)
  .addNode("split", () => ({}))
  .addNode("left", () => ({ cursor: 1 }))
  .addNode("right", () => ({ cursor: 2 }))
  .addEdge(START, "split")
  .addEdge("split", "left")
  .addEdge("split", "right")
  .addEdge("left", END)
  .addEdge("right", END)
  .compile();

const seen: number[] = [];
for (let run = 0; run < 10; run += 1) {
  const { cursor } = await graph.invoke({});
  seen.push(cursor);
}

console.log(`cursor over ten runs: ${seen.join(" ")}`);
console.log(
  new Set(seen).size === 1
    ? "Stable on this machine. That is the failure, not the absence of one."
    : "Unstable already. Imagine it under a real supplier API.",
);
