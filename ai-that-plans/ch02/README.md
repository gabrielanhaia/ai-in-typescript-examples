# ch02 — Your first graph: nodes, edges, and `compile()`

Chapter 1's `while` loop, rebuilt on `@langchain/langgraph` 1.4.8 so that the
structure stops being control flow and becomes data. Two nodes, three edges,
one state object. The assistant does not get cleverer; it gets legible.

The graph runs `plan` then `act`, once, and stops. `act` carries out the first
step of the plan and no more — going back for the other five needs a
conditional edge, which is chapter 4.

| File | What it does | Needs |
|---|---|---|
| [`state.ts`](state.ts) | The two state fields, declared up front: `messages` and `steps`. Exports `PlanState` and the `State` / `Update` type aliases every node is written against. | — |
| [`tools.ts`](tools.ts) | The chapter's own local copy of the shop's six steps. Chapter 1's sample order, hard-coded, so the graph runs end to end with no database. | — |
| [`plan.ts`](plan.ts) | The `plan` node. Reads the conversation, returns an ordered list of step names. The only node in the book bound to Opus. | key |
| [`act.ts`](act.ts) | The `act` node. Runs `steps[0]` and appends one `AIMessage`. | — |
| [`graph.ts`](graph.ts) | Three `addEdge` calls and a `compile()`. The only file that describes the shape of the run. | key¹ |
| [`run.ts`](run.ts) | The chapter default. One `invoke`, then the plan, the message count and the last line. | key |
| [`watch.ts`](watch.ts) | The same run through `stream` with `streamMode: "updates"` — one line per superstep. | key |
| [`draw.ts`](draw.ts) | `getGraphAsync().drawMermaid()`. Paste the output into anything that renders Mermaid. | key¹ |
| [`complain.ts`](complain.ts) | **Not printed in the book.** The first two "Make it complain" experiments, run against a stand-in graph so you do not have to break your own files. | — |

¹ `graph.ts` imports `plan.ts`, which constructs `ChatAnthropic` at module
scope, and that constructor throws `Anthropic API key not found` when the
variable is unset. So `draw.ts` needs `ANTHROPIC_API_KEY` to *exist* even
though it never calls a model — any non-empty string will do. See **Where this
differs from the page**.

## Run it

```bash
npm run run-example -- ch02            # the default: ch02/run
npm run run-example -- ch02/run
npm run run-example -- ch02/watch
npm run run-example -- ch02/draw
npm run run-example -- ch02/complain   # no key, no network
```

Or directly, without going through npm:

```bash
node --env-file-if-exists=.env --import tsx ch02/run.ts
```

`ch02/complain.ts` is the one to reach for on a clean clone with nothing
configured:

```bash
npx tsx ch02/complain.ts
```

## Expected output

### `run.ts` — key required

Six `plan` lines, then two summary lines:

```text
plan  lookup_order
plan  check_warranty
plan  find_parts
plan  order_part
plan  book_workshop_slot
plan  notify_customer
msgs  2
last  lookup_order -> ORD-4471, frame VER-8802, bought 2025-11-03
```

The `plan` lines are the planner's answer, not the code's, so your run may come
back with fewer of them or with a different order. Everything below them is
guaranteed by the code: `msgs 2` is the customer's message plus the one line
`act` wrote, and `last` is always `lookup_order -> …` if `lookup_order` is the
first step the planner chose, because `act` runs `steps[0]` and stops.

### `watch.ts` — key required

Two ticks, one node each, one field written each:

```text
plan wrote steps
act wrote messages
```

That is the whole run as the runtime sees it. Change the request to *"Do you
sell inner tubes?"* and you get exactly the same two lines — a straight line
has no opinion about its input, which is chapter 4's missing capability in its
cheapest demonstration.

### `draw.ts` — key must be set, but is never used

```text
%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	plan(plan)
	act(act)
	__end__([<p>__end__</p>]):::last
	__start__ --> plan;
	act --> __end__;
	plan --> act;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
```

Byte-identical on every machine — no model is consulted to draw a graph.

### `complain.ts` — no key, no network

```text
--- addEdge(START, "plan") commented out ---
Node `plan` is not reachable.

If you are returning Command objects from your node,
make sure you are passing names of potential destination nodes as an "ends" array
into ".addNode(..., { ends: ["node1", "node2"] })".

Troubleshooting URL: https://docs.langchain.com/oss/javascript/langgraph/UNREACHABLE_NODE/


--- addEdge("plan", "notify"), the middle edge ---
Node `act` is not reachable.

If you are returning Command objects from your node,
make sure you are passing names of potential destination nodes as an "ends" array
into ".addNode(..., { ends: ["node1", "node2"] })".

Troubleshooting URL: https://docs.langchain.com/oss/javascript/langgraph/UNREACHABLE_NODE/


--- addEdge("act", "notify"), the last edge ---
Found edge ending at unknown node `notify`

--- state field renamed to `plan` ---
plan is already being used as a state attribute (a.k.a. a channel), cannot also be used as a node name.
```

Every one of those fires before a model call is made. The last one fires from
`addNode` rather than from `compile()`, which is the chapter's point: node
registration validates immediately and only the wiring waits for the compile.

## The other two experiments

The chapter's third and fourth experiments run the real graph, so they need a
key.

**Ask it something that needs no plan.** Edit the request in `ch02/watch.ts` to
*"Do you sell inner tubes?"* and run it. The graph plans it anyway and acts on
whatever came back; the two ticks go past exactly as before.

**Throw from inside `act`.** Replace the body of `act` in `ch02/act.ts` with
`throw new Error("supplier API is down")` and run `ch02/run.ts`. The error comes
straight back out of `invoke` with its own message — and afterwards you have
nothing. The planner call was made and paid for and no artifact anywhere says a
run happened. That is chapter 5's problem, stated.

Put both files back before you go on.

## Where this differs from the page

**`draw.ts` needs the key variable set.** The chapter says the drawing comes
"from the same object, with no extra dependency", and it does — `getGraphAsync`
makes no network call. But `draw.ts` imports `graph.ts`, `graph.ts` imports
`plan.ts`, and `plan.ts` builds its `ChatAnthropic` at module scope. In
`@langchain/anthropic` 1.5.2 that constructor throws `Anthropic API key not
found` when `ANTHROPIC_API_KEY` is unset, so the import chain fails before
`draw.ts` runs a line. `ANTHROPIC_API_KEY=unused npx tsx ch02/draw.ts` is
enough; nothing is sent anywhere.

**Misspelling the *middle* edge does not print the message on the page.** The
chapter shows `Found edge ending at unknown node \`notify\`` for the experiment
that misspells the destination of `addEdge("plan", "act")`. In the shipped
1.4.8, `validate()` runs the reachability check before the unknown-node check,
and misspelling that edge leaves `act` with nothing pointing at it — so what
you actually get is `Node \`act\` is not reachable.` The printed message is
real, and `complain.ts` shows the arrangement that produces it: misspell the
*last* edge instead, where both nodes stay reachable and validation gets as far
as the unknown-node check.

**The unreachable-node error is longer than the page shows.** The chapter
prints one line, `Node \`plan\` is not reachable.` The shipped error adds three
lines about `Command` and `ends`, and a troubleshooting URL. The first line is
the one that matters and is the one quoted.

**`docker compose run ai-that-plans ch02`** is printed in the chapter as the
alternative to installing a toolchain. This directory's `docker-compose.yml`
publishes Postgres only, and Postgres is not needed until chapter 6 — so use
`npm run run-example` for this chapter.

**`ch02/tools.ts` is not the shared shop fixture.** The chapter prints its own
local copy on purpose, and its `find_parts` returns `HUB-VR-142 rear hub, in
stock, Coldharbour, GBP 68.40` where [`../shop/tools.ts`](../shop/tools.ts)
returns `HB-118 rear hub, Fettle Components, GBP 68.40`. The printed listing is
reproduced exactly; the two fixtures converge from chapter 4 onward, where the
listings import the shop directly.
