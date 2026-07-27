// NOT A LISTING FROM THE BOOK.
//
// The chapter default, and the keyless half of ch04. Every claim the chapter
// makes that does not need the planner is checked here, in the order the
// chapter makes them:
//
//   1. decide() is a pure function of state              §"The decision has three answers"
//   2. the path map puts the route names on the drawing  §"Wiring it"
//   3. Command loses the names, and the map turns the
//      unreachable-node check back on                    §"The same decision, inside the node"
//   4. the route is the log line                         §"The route is the log line"
//   5. Send fans out and a reducer makes the fan-in safe  §"Fan-out with Send"
//   6. defer, and the collector that runs twice           §"Break it on purpose"
//   7. the recursion limit counts supersteps, not tasks   §"The recursion limit"
//
// No key, no network, no container. Run it on a clean clone.
import {
  StateGraph,
  StateSchema,
  ReducedValue,
  GraphRecursionError,
  START,
  END,
} from "@langchain/langgraph";
import { z } from "zod";
import { PlanState, type State } from "./state.js";
import { decide, type Route } from "./route.js";
import { plan } from "./plan.js";
import { execute, advance, notify } from "./nodes.js";
import { graph } from "./graph.js";
import { budgetFor } from "./limit.js";
import { commandGraph } from "./command-graph.js";
import { partsGraph } from "./fanout.js";
import { CANDIDATES, LOOKUP_MS } from "./supplier.js";

function heading(text: string): void {
  console.log(`\n--- ${text} ${"-".repeat(Math.max(0, 68 - text.length))}`);
}

/** Only the edges, which is the part of drawMermaid() the chapter prints. */
function edgesOf(mermaid: string): string {
  return mermaid
    .split("\n")
    .filter((line) => line.includes("-->") || line.includes(".->"))
    .map((line) => line.trim())
    .join("\n");
}

/** A state to ask decide() about, with only the fields it reads spelled out. */
function stateAt(fields: Partial<State>): State {
  return {
    messages: [],
    steps: [
      "lookup_order",
      "check_warranty",
      "find_parts",
      "order_part",
      "book_workshop_slot",
      "notify_customer",
    ],
    cursor: 0,
    attempts: 1,
    lastError: "",
    completed: [],
    ...fields,
  };
}

// 1 --------------------------------------------------------------------------
heading("decide() is a function from a state to a string");

for (const at of [
  stateAt({ cursor: 0 }),
  stateAt({ cursor: 5 }),
  stateAt({ cursor: 2, attempts: 1, lastError: "supplier catalog timed out" }),
  stateAt({ cursor: 2, attempts: 3, lastError: "supplier catalog timed out" }),
]) {
  console.log(
    `cursor=${at.cursor} attempts=${at.attempts} ` +
      `lastError=${at.lastError === "" ? '""' : `"${at.lastError}"`} ` +
      `-> ${decide(at)}`,
  );
}

// 2 --------------------------------------------------------------------------
heading("the path map puts the route names on the drawing");
console.log(edgesOf((await graph.getGraphAsync()).drawMermaid()));

// 3 --------------------------------------------------------------------------
heading("Command declares the same three destinations, unlabelled");
console.log(edgesOf((await commandGraph.getGraphAsync()).drawMermaid()));

heading("no path map: the branch is assumed to reach everything");
const mapless = new StateGraph(PlanState)
  .addNode("plan", plan)
  .addNode("execute", execute)
  .addNode("advance", advance)
  .addNode("notify", notify)
  .addEdge(START, "plan")
  .addEdge("plan", "execute")
  // No third argument, and no edge out of advance either: advance is now a
  // node nothing routes to, and this still compiles.
  .addConditionalEdges("execute", decide)
  .addEdge("notify", END)
  .compile();
console.log(edgesOf((await mapless.getGraphAsync()).drawMermaid()));

heading("with a path map, the same orphan fails to compile");
try {
  new StateGraph(PlanState)
    .addNode("plan", plan)
    .addNode("execute", execute)
    .addNode("advance", advance)
    .addNode("notify", notify)
    .addEdge(START, "plan")
    .addEdge("plan", "execute")
    // "continue" left out, so nothing routes to advance.
    .addConditionalEdges("execute", decide, {
      retry: "execute",
      finish: "notify",
    })
    .addEdge("advance", "execute")
    .addEdge("notify", END)
    .compile();
  console.log("compiled, which it should not have");
} catch (error) {
  console.log((error as Error).message.split("\n")[0]);
}

// 4 --------------------------------------------------------------------------
heading("the route is the log line");

/** Four fields, one line per superstep. Wrap decide where you wire it. */
function logged(router: (state: State) => Route) {
  return (state: State): Route => {
    const route = router(state);
    console.log(
      `route=${route} step=${state.steps[state.cursor]} ` +
        `cursor=${state.cursor} attempt=${state.attempts}`,
    );
    return route;
  };
}

const log = logged(decide);
log(stateAt({ cursor: 2, attempts: 2, lastError: "supplier catalog timed out" }));
log(stateAt({ cursor: 2, attempts: 3 }));
log(stateAt({ cursor: 5, attempts: 1 }));

// 5 --------------------------------------------------------------------------
heading("Send: one task per candidate, all in one superstep");
const startedAt = Date.now();
const parts = await partsGraph.invoke({ candidates: CANDIDATES });
const elapsed = Date.now() - startedAt;

for (const quote of parts.quotes) {
  console.log(
    `${quote.sku} ${quote.inStock ? "in stock" : "no stock"} ` +
      `GBP ${(quote.pence / 100).toFixed(2)}`,
  );
}
console.log(`chosen ${parts.chosen}`);
console.log(
  `${parts.quotes.length} quotes in ${elapsed} ms; ` +
    `one at a time would be about ${CANDIDATES.length * LOOKUP_MS} ms`,
);

// 6 --------------------------------------------------------------------------
heading("defer: the collector behind branches of different lengths");

const Counted = new StateSchema({
  seen: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.string(),
    reducer: (current: string[], next: string) => [...current, next],
  }),
});

/** Two branches into one collector. The right-hand one is a node longer. */
function collectorRuns(defer: boolean): Promise<number> {
  const counter = { runs: 0 };
  const built = new StateGraph(Counted)
    .addNode("short", () => ({ seen: "short" }))
    .addNode("long", () => ({ seen: "long" }))
    .addNode("longer", () => ({ seen: "longer" }))
    .addNode(
      "collect",
      () => {
        counter.runs += 1;
        return {};
      },
      { defer },
    )
    .addEdge(START, "short")
    .addEdge(START, "long")
    .addEdge("long", "longer")
    .addEdge("short", "collect")
    .addEdge("longer", "collect")
    .addEdge("collect", END)
    .compile();
  return built.invoke({}).then(() => counter.runs);
}

console.log(`defer: false -> the collector ran ${await collectorRuns(false)} times`);
console.log(`defer: true  -> the collector ran ${await collectorRuns(true)} time`);

// 7 --------------------------------------------------------------------------
heading("the recursion limit counts supersteps, not tasks");

let cost = 0;
for (let limit = 1; limit <= 25; limit += 1) {
  try {
    await partsGraph.invoke({ candidates: CANDIDATES }, { recursionLimit: limit });
    cost = limit;
    break;
  } catch (error) {
    if (error instanceof GraphRecursionError) continue;
    throw error;
  }
}
console.log(
  `${CANDIDATES.length} parallel lookups cost ${cost} supersteps: ` +
    "dispatch, the fan-out, the barrier.",
);
console.log(`budgetFor(6, 2) on the chapter's graph = ${budgetFor(6, 2)}`);
