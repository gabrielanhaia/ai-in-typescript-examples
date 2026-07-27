// NOT A LISTING FROM THE BOOK.
//
// `assistant` — the graph five of this chapter's printed listings import
// (`./graph.js`) and none of them print. Chapter 5's six nodes in a line, with
// exactly two things this chapter asks for and nothing else:
//
//   1. `find_parts` is instrumented as ch09/progress.ts prints it, because the
//      browser client listens for `custom` events and renders
//      `d.node + " " + (d.supplier ?? d.phase)`. The node body below is that
//      listing's body, unchanged.
//   2. There is no interrupt. Chapter 8 gates `order_part`; this chapter says
//      "the run reaches `notify_customer` regardless", so it does.
//
// No node here calls a model, for chapter 5's reason: a chapter about watching
// a run needs the same run every time. Everything in ch09 therefore runs with
// no API key — and `streamMode: "messages"` has nothing to report on a graph
// that never calls a model. The README says what to do about that.
import { AIMessage } from "@langchain/core/messages";
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { runTool } from "./shop.js";
import { PlanState, type State } from "./state.js";
import { searchSupplier, SUPPLIERS } from "./suppliers.js";

/** What one call to the shop costs, in milliseconds — chapter 5's `STEP_MS`,
 *  fixed. Without it five of the six steps finish inside the same millisecond,
 *  the browser's first frame reports a run that is already half over, and a
 *  chapter about watching progress has no progress to watch. */
const STEP_MS = 200;

const worked = () => new Promise((resolve) => setTimeout(resolve, STEP_MS));

/** The four steps that are one call to the shop: its line of text into
 *  `results`, and the cursor moved on by one. */
const step = (name: string) => async (state: State) => {
  await worked();
  return {
    results: { [name]: await runTool(name) },
    cursor: state.cursor + 1,
  };
};

/** Step six. The message the customer would receive, assembled from what the
 *  five steps before it wrote. */
function draft(state: State): string {
  return [
    "Your Verano is in cover, so there is nothing to pay.",
    `Parts: ${state.results.find_parts ?? "none found"}.`,
    `Workshop: ${state.results.book_workshop_slot ?? "not booked"}.`,
  ].join(" ");
}

/** In memory, and in one process — which is the same process the hub's `Map`
 *  lives in. A browser that reconnects is reading a checkpoint written by the
 *  run it lost; a redeploy is chapter 6's problem, not this chapter's. */
export const assistant = new StateGraph(PlanState)
  .addNode("lookup_order", step("lookup_order"))
  .addNode("check_warranty", step("check_warranty"))
  .addNode("find_parts", async (state, runtime) => {
    runtime.writer({ node: "find_parts", phase: "start" });

    const found: string[] = [];
    for (const supplier of SUPPLIERS) {
      runtime.writer({ node: "find_parts", supplier });
      found.push(...(await searchSupplier(supplier)));
    }

    runtime.writer({ node: "find_parts", phase: "done" });
    return {
      results: { find_parts: found.join(", ") },
      cursor: state.cursor + 1,
    };
  })
  .addNode("order_part", step("order_part"))
  .addNode("book_workshop_slot", step("book_workshop_slot"))
  .addNode("notify_customer", async (state) => {
    await worked();
    return {
      results: { notify_customer: await runTool("notify_customer") },
      cursor: state.cursor + 1,
      messages: new AIMessage(draft(state)),
    };
  })
  .addEdge(START, "lookup_order")
  .addEdge("lookup_order", "check_warranty")
  .addEdge("check_warranty", "find_parts")
  .addEdge("find_parts", "order_part")
  .addEdge("order_part", "book_workshop_slot")
  .addEdge("book_workshop_slot", "notify_customer")
  .addEdge("notify_customer", END)
  .compile({ checkpointer: new MemorySaver() });
