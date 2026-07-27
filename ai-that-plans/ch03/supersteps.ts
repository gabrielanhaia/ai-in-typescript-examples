// NOT A LISTING FROM THE BOOK.
//
// The three ticks the chapter describes but does not print — the run behind
// the second diagram: "`planner` fills `plan` with six steps and adds a
// message; after that each executing node — `lookup_order`, then
// `check_warranty` — puts one key into `results` and moves `cursor` on by
// one, and `plan` never moves again."
//
// It prints one line per superstep so you can see which fields are quiet.
// No model is called and no key is needed: every value here comes from the
// fixture tool surface, so the output is the same on every machine.
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";
import { runTool, STEP_NAMES } from "./shop.js";
import { PlanState, type State } from "./state.js";

const ASKED =
  "my Verano hybrid is under warranty and the rear hub is grinding, " +
  "can you sort it?";

/** Writes `plan` and `messages`. Never writes `cursor` or `results`. */
const planner: typeof PlanState.Node = (state) => {
  // `signal` is an UntrackedValue and nothing has written it, so the key is
  // simply absent from the object. Guard, do not assume.
  const signal: AbortSignal | undefined = state.signal;
  if (signal?.aborted === true) return {};

  return {
    plan: STEP_NAMES.map((tool) => ({
      tool,
      why: "the warranty job needs it",
    })),
    messages: [new AIMessage(`six steps, starting with ${STEP_NAMES[0]}`)],
  };
};

/** One key into `results`, one step of `cursor`. Nothing else. */
function executes(tool: string): typeof PlanState.Node {
  return async (state) => ({
    results: { [tool]: await runTool(tool) },
    cursor: state.cursor + 1,
  });
}

const graph = new StateGraph(PlanState)
  .addNode("planner", planner)
  .addNode("lookup_order", executes("lookup_order"))
  .addNode("check_warranty", executes("check_warranty"))
  .addEdge(START, "planner")
  .addEdge("planner", "lookup_order")
  .addEdge("lookup_order", "check_warranty")
  .addEdge("check_warranty", END)
  .compile();

function show(label: string, state: State): void {
  const results = Object.keys(state.results);
  console.log(
    `${label.padEnd(16)} messages=${state.messages.length}` +
      `  plan=${state.plan.length}` +
      `  cursor=${state.cursor}` +
      `  results=[${results.join(", ")}]`,
  );
}

const stream = await graph.stream(
  { messages: [new HumanMessage(ASKED)] },
  { streamMode: "values" },
);

const labels = ["input", "planner", "lookup_order", "check_warranty"];
let tick = 0;
for await (const state of stream) {
  show(labels[tick] ?? `tick ${tick}`, state);
  tick += 1;
}

console.log(
  "\nplan was written once and never moved; cursor changed by one each " +
    "tick; results only grew.",
);
