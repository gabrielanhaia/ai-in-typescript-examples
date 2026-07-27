// NOT A LISTING FROM THE BOOK.
//
// A driver for the two printed listings that only export functions:
// `record` and `advance` from ./nodes.ts, then `startOver` from ./reset.ts.
//
// It exists to make the chapter's two claims about those nodes visible:
//
//   * `record` returns one key and never spreads `state.results`, yet the
//     results still accumulate — because the channel owns the merge.
//   * `startOver` wraps its write in `Overwrite`, which bypasses that merge
//     and empties an accumulating channel in a single step.
//
// The loop is by hand here. Chapter 4 replaces it with a conditional edge.
// No key needed.
import { END, START, StateGraph } from "@langchain/langgraph";
import { record, advance } from "./nodes.js";
import { startOver } from "./reset.js";
import { STEP_NAMES } from "./shop.js";
import { PlanState, type State, type Update } from "./state.js";

const step = new StateGraph(PlanState)
  .addNode("record", record)
  .addNode("advance", advance)
  .addEdge(START, "record")
  .addEdge("record", "advance")
  .addEdge("advance", END)
  .compile();

const reset = new StateGraph(PlanState)
  .addNode("startOver", startOver)
  .addEdge(START, "startOver")
  .addEdge("startOver", END)
  .compile();

function show(label: string, state: State): void {
  console.log(
    `${label.padEnd(9)} cursor=${state.cursor}  ` +
      `results={${Object.keys(state.results).join(", ")}}`,
  );
}

const plan = STEP_NAMES.map((tool) => ({ tool, why: "the warranty job" }));

let state: State = await step.invoke({ plan });
show("step 1", state);

for (const label of ["step 2", "step 3"]) {
  state = await step.invoke(state as Update);
  show(label, state);
}

state = await reset.invoke(state as Update);
show("startOver", state);
