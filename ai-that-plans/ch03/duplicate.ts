// NOT A LISTING FROM THE BOOK.
//
// The chapter prints the *output* of this mistake as a text block but never
// the code that produces it:
//
//     lookup_order, lookup_order, check_warranty,
//     lookup_order, lookup_order, check_warranty, find_parts
//
// Seven entries after three steps. The channel appends, and the node returns
// the accumulation instead of the delta, so the channel appends the running
// total to itself. Both graphs below use the same channel; only the node
// differs. No key needed.
import {
  END,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import { z } from "zod";

/** A plain appending channel: current, then whatever the node added. */
const Completed = new StateSchema({
  completed: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.array(z.string()),
      reducer: (current, next) => [...current, ...next],
    },
  ),
});

const STEPS = ["lookup_order", "check_warranty", "find_parts"] as const;

/** The mistake: returns the new total. */
const wrong = (step: string): typeof Completed.Node => (state) => ({
  completed: [...state.completed, step],
});

/** The rule: returns only what it added. */
const right = (step: string): typeof Completed.Node => () => ({
  completed: [step],
});

function build(node: (step: string) => typeof Completed.Node) {
  return new StateGraph(Completed)
    .addNode("one", node(STEPS[0]))
    .addNode("two", node(STEPS[1]))
    .addNode("three", node(STEPS[2]))
    .addEdge(START, "one")
    .addEdge("one", "two")
    .addEdge("two", "three")
    .addEdge("three", END)
    .compile();
}

for (const [label, node] of [
  ["returns the total", wrong],
  ["returns the delta", right],
] as const) {
  const { completed } = await build(node).invoke({});
  console.log(`${label}: ${completed.length} entries`);
  console.log(`  ${completed.join(", ")}`);
}
