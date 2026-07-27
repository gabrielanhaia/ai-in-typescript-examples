// ch04/fanout.ts
import {
  StateGraph,
  StateSchema,
  ReducedValue,
  Send,
  START,
  END,
} from "@langchain/langgraph";
import { z } from "zod";
import { quoteFor } from "./supplier.js";

const Quote = z.object({
  sku: z.string(),
  inStock: z.boolean(),
  pence: z.number(),
});

export const PartsState = new StateSchema({
  candidates: z.array(z.string()).default(() => []),
  quotes: new ReducedValue(z.array(Quote).default(() => []), {
    inputSchema: Quote,
    reducer: (current, next) => [...current, next],
  }),
  chosen: z.string().default(""),
});
type Parts = typeof PartsState.State;

/** One task per candidate, all dispatched in one superstep. */
function fanOut(state: Parts) {
  return state.candidates.map((sku) => new Send("quote", { sku }));
}

/** Receives the Send payload, not the graph state. */
async function quote(input: { sku: string }) {
  return { quotes: await quoteFor(input.sku) };
}

/** The barrier: one run, after every quote has landed. */
function choose(state: Parts) {
  const best = state.quotes
    .filter((q) => q.inStock)
    .sort((a, b) => a.pence - b.pence)[0];
  return { chosen: best?.sku ?? "" };
}

export const partsGraph = new StateGraph(PartsState)
  .addNode("quote", quote)
  // defer holds the barrier until nothing else can run. See below.
  .addNode("choose", choose, { defer: true })
  .addConditionalEdges(START, fanOut, ["quote"])
  .addEdge("quote", "choose")
  .addEdge("choose", END)
  .compile();
