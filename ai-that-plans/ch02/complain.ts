// NOT A LISTING FROM THE BOOK.
//
// "Make it complain", the first two experiments, without editing anything.
//
// The chapter asks you to break `ch02/graph.ts` by hand — delete the first
// edge, misspell a destination, rename the state field — and read what comes
// back. This file does the same three things to a stand-in graph so you can
// see all three messages in one run, then leave the chapter's files alone.
//
// It is the minimal StateGraph: the chapter's own `PlanState`, two nodes with
// the chapter's two names, and node bodies that do nothing. `compile()` and
// `addNode` throw before a node body is ever called, and nothing here imports
// `./plan.js`, so this runs with no API key and touches no network. That is
// the chapter's point: both of these failures are free.
//
// The third and fourth experiments — asking for something that needs no plan,
// and throwing from inside `act` — both run the real graph, so they need a key.
// The README says how.
import { END, MessagesValue, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { PlanState } from "./state.js";

/** Never called: every failure below fires while the graph is being built. */
const stand_in = async () => ({});

function complain(label: string, build: () => unknown): void {
  console.log(`--- ${label} ---`);
  try {
    build();
    console.log("no error: this one did not complain\n");
  } catch (error) {
    console.log(`${(error as Error).message}\n`);
  }
}

// 1. Delete the first edge. Every node is orphaned and compile() says so.
complain("addEdge(START, \"plan\") commented out", () =>
  new StateGraph(PlanState)
    .addNode("plan", stand_in)
    .addNode("act", stand_in)
    .addEdge("plan", "act")
    .addEdge("act", END)
    .compile(),
);

// 2. Put it back and misspell the destination of the middle edge instead.
//    The `as "act"` is the cast that defeats the compiler on purpose: the
//    chapter's whole point about the builder is that `"notify"` does not
//    typecheck, so a runtime message can only be reached by lying to tsc.
complain("addEdge(\"plan\", \"notify\"), the middle edge", () =>
  new StateGraph(PlanState)
    .addNode("plan", stand_in)
    .addNode("act", stand_in)
    .addEdge(START, "plan")
    .addEdge("plan", "notify" as "act")
    .addEdge("act", END)
    .compile(),
);

// 2b. The same misspelling on the LAST edge, which leaves both nodes reachable
//     and so gets as far as the unknown-node check. See the README: the message
//     the chapter prints for this experiment is this one, not the one above.
complain("addEdge(\"act\", \"notify\"), the last edge", () =>
  new StateGraph(PlanState)
    .addNode("plan", stand_in)
    .addNode("act", stand_in)
    .addEdge(START, "plan")
    .addEdge("plan", "act")
    .addEdge("act", "notify" as "act")
    .compile(),
);

// 3. Make the collision happen: the state field renamed from `steps` to `plan`,
//    with the node names left alone. This one throws from addNode, not compile.
const CollidingState = new StateSchema({
  messages: MessagesValue,
  plan: z.array(z.string()).default(() => []),
});

complain("state field renamed to `plan`", () =>
  new StateGraph(CollidingState).addNode("plan", stand_in),
);
