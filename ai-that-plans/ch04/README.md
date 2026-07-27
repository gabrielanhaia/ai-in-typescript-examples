# ch04 — Conditional edges: letting the graph decide

Chapter 3's graph runs its planner, then one node, then stops. This directory
puts the three branches back — retry, continue, finish — twice: once as a
conditional edge with a path map, and once as a node returning `Command`. Then
`Send` fans one node out over a list, and the recursion limit puts a ceiling on
the whole thing.

| File | What it does | Needs |
|---|---|---|
| [`state.ts`](state.ts) | `PlanState`. Chapter 3's state, with the four fields this chapter's decision reads spelled out. | — |
| [`route.ts`](route.ts) | `decide`. Six lines, no imports that do anything at runtime, no model, no graph. | — |
| [`nodes.ts`](nodes.ts) | `execute`, `advance`, `notify`. `advance` is the only code that moves the cursor and the only code that resets `attempts`. | — |
| [`graph.ts`](graph.ts) | The four-node graph, wired with `addConditionalEdges` and a path map. | — |
| [`route.test.ts`](route.test.ts) | Three tests. No graph compiled, no model called, no key read. | — |
| [`command-graph.ts`](command-graph.ts) | The same decision, made inside the node and returned as a `Command`. Both printed blocks are one file. | — |
| [`fanout.ts`](fanout.ts) | `Send` and the barrier: one task per candidate part, `defer: true` on the collector. Both printed blocks are one file. | — |
| [`limit.ts`](limit.ts) | `budgetFor` and `runPlan`: the recursion limit set per invocation and `GraphRecursionError` caught where you can say something about it. | — |
| [`plan.ts`](plan.ts) | **Not printed.** Chapter 2's planner node, still the only node bound to `claude-opus-5`. | key |
| [`tools.ts`](tools.ts) | **Not printed.** The shop's six tools from Book 3, plus the `runStep` this chapter's nodes read a result from. | — |
| [`supplier.ts`](supplier.ts) | **Not printed.** The price list `fanout.ts` quotes against: four hubs, one out of stock. | — |
| [`run-examples.ts`](run-examples.ts) | **Not from the book.** Every claim in the chapter that does not need the planner, checked. The chapter default. | — |
| [`run.ts`](run.ts) | **Not from the book.** Runs both graphs on the warranty job and compares what they completed. | key |

## Run it

From the `ai-that-plans` directory:

```bash
npx tsx ch04/run-examples.ts      # no key, no network, no container
npx tsx ch04/run.ts               # needs ANTHROPIC_API_KEY
npx vitest run ch04               # the three routing tests
```

Once the repo-level runner is in place, `npm run run-example -- ch04` and
`npm run run-example -- ch04/run` are the same two commands with `../.env` and
`.env` read first.

The remaining files are modules. `npx tsx ch04/state.ts` and friends run and
print nothing, which is correct — they export.

## Expected output

### `run-examples.ts`

Deterministic apart from the millisecond count on the fan-out line.

```text
--- decide() is a function from a state to a string ---------------------
cursor=0 attempts=1 lastError="" -> continue
cursor=5 attempts=1 lastError="" -> finish
cursor=2 attempts=1 lastError="supplier catalog timed out" -> retry
cursor=2 attempts=3 lastError="supplier catalog timed out" -> finish

--- the path map puts the route names on the drawing --------------------
__start__ --> plan;
advance --> execute;
notify --> __end__;
plan --> execute;
execute -. &nbsp;continue&nbsp; .-> advance;
execute -. &nbsp;finish&nbsp; .-> notify;
execute -. &nbsp;retry&nbsp; .-> execute;

--- Command declares the same three destinations, unlabelled ------------
__start__ --> plan;
advance --> execute;
notify --> __end__;
plan --> execute;
execute -.-> advance;
execute -.-> notify;
execute -.-> execute;

--- no path map: the branch is assumed to reach everything --------------
__start__ --> plan;
notify --> __end__;
plan --> execute;
execute -.-> plan;
execute -.-> advance;
execute -.-> notify;
execute -.-> __end__;

--- with a path map, the same orphan fails to compile -------------------
Node `advance` is not reachable.

--- the route is the log line -------------------------------------------
route=retry step=find_parts cursor=2 attempt=2
route=continue step=find_parts cursor=2 attempt=3
route=finish step=notify_customer cursor=5 attempt=1

--- Send: one task per candidate, all in one superstep ------------------
HB-118 in stock GBP 68.40
HB-120 in stock GBP 71.95
HB-131 no stock GBP 59.90
HB-142 in stock GBP 74.20
chosen HB-118
4 quotes in 142 ms; one at a time would be about 480 ms

--- defer: the collector behind branches of different lengths -----------
defer: false -> the collector ran 2 times
defer: true  -> the collector ran 1 time

--- the recursion limit counts supersteps, not tasks --------------------
4 parallel lookups cost 3 supersteps: dispatch, the fan-out, the barrier.
budgetFor(6, 2) on the chapter's graph = 18
```

Seven things to read off that page, in the order the chapter argues them.

**The two mermaid blocks are the two the chapter prints**, edge for edge. The
first carries `continue`, `finish` and `retry` on its dashed arrows; the second
carries the same three arrows with nothing on them. Nothing generated them but
the code above them.

**The third mermaid block is the drawing with the path map deleted.** `execute`
now connects to `plan`, `advance`, `notify` and `__end__` — every box on the
page. That is not a picture of the agent, it is a picture of the framework's
ignorance, and it is what a compiled graph looks like when nobody told it where
a branch can go.

**The line after it is the check the path map buys back.** The same graph, with
a map that leaves `continue` out, does not compile: `advance` is unreachable and
LangGraph says so by name. Delete the map and the orphan compiles happily.

**The three `route=` lines are the format the chapter prints**, produced by
wrapping `decide` rather than by editing it. Four fields, one line per
superstep, and none of it inside a node.

**The fan-out takes one lookup's worth of wall clock, not four.** Four `Send`s
in one superstep, four writes to `quotes` merged by its reducer, and a barrier
that picks the cheapest **in stock** — which is `HB-118` at GBP 68.40, not the
cheaper `HB-131` at GBP 59.90 that nobody has.

**`defer` is not decoration.** Two branches of different lengths into one
collector: without `defer` it runs twice, silently; with it, once.

**The limit counts supersteps.** Four parallel lookups cost three of them —
dispatch, the fan-out, the barrier — which is the chapter's claim that forty
`Send`s would cost the same three.

### `run.ts`

Needs `ANTHROPIC_API_KEY`. The plan is the model's, so a run of yours may come
back with fewer steps or a different order — but both graphs get the *same*
plan text and, on the six-step plan, print this:

```text
limit             18
conditional edge  lookup_order, check_warranty, find_parts, order_part, book_workshop_slot, notify_customer
                  Done: lookup_order, check_warranty, find_parts, order_part, book_workshop_slot, notify_customer.
Command           lookup_order, check_warranty, find_parts, order_part, book_workshop_slot, notify_customer
                  Done: lookup_order, check_warranty, find_parts, order_part, book_workshop_slot, notify_customer.
same six steps, same order: true
```

That last line is the chapter's claim about the two routing styles, checked:
identical behaviour, completely different graphs on paper.

`find_parts` fails the first time it is attempted at a given cursor, so the
retry route fires in both runs and neither `completed` list shows it twice —
`execute` records a step once, when it commits. The topology's real cost on that
job is **15 supersteps**; `budgetFor(6, 2)` gives 18, and the three spare are
headroom you chose rather than headroom you found.

With no key it exits 1 and names the file that does run without one.

### `route.test.ts`

```text
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Milliseconds, and nothing in them that could fail intermittently.

## Break it on purpose

The chapter lists five experiments. Three of them are already in
`run-examples.ts` — deleting the path map, the unreachable-node check, and
taking `defer` off a collector behind unequal branches. The other two want you
to edit a file, so they are not shipped pre-broken:

- **Make `decide` always return `"retry"`.** One character in
  [`route.ts`](route.ts), then `npx tsx ch04/run.ts`. The run spins between
  `execute` and itself until the limit fires. Raise `budgetFor`'s constants and
  watch it spin for longer.
- **Return a route the map does not contain.** Change `"finish"` to `"done"` in
  `decide` and leave `graph.ts` alone: the run fails at that superstep with
  `Branch condition returned unknown or null destination`. Make the same mistake
  in [`command-graph.ts`](command-graph.ts) — a `goto` naming a node that does
  not exist — and `invoke` resolves normally with nothing having happened.

## Where this differs from the page

**`runStep` returns a result, and the shared fixture throws.** The printed
`nodes.ts` reads `result.ok` and `result.error`, so `runStep` here answers with
`{ ok: true, output }` or `{ ok: false, error }`. The shared surface in
[`../shop/tools.ts`](../shop/tools.ts) — which chapters 2 and 3 read a line of
text back from — raises instead. [`tools.ts`](tools.ts) re-exports that whole
surface and wraps the one function, so the failure is the same failure and the
printed listings are unchanged.

**The planner is built on first call, not at import.** Chapter 2 prints
`const planner = new ChatAnthropic(...)` at module scope. Here that would mean
`ch04/run-examples.ts` could not import `ch04/graph.ts` without a key, and
drawing a graph is not calling a model. `plan.ts` is chapter 2's node with the
binding moved inside the function and nothing else changed.

**`ch04/plan.ts` imports `./tools.js`, not `./shop.js`.** Every printed import
in this chapter uses `./tools.js`, so that is the name this directory provides.
`../shop/tools.js` is importable directly, as its header says.

**`ROUTES` is described but not printed.** The chapter suggests giving the path
map a name and the type `Record<Route, "execute" | "advance" | "notify">` so a
missing route becomes a compile error. `graph.ts` is reproduced as printed, with
the bare object literal; the typed version is four lines you can add without
touching anything else.
