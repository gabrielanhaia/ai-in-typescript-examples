# ch14 — Monday morning: the planning assistant, end to end

Thirteen chapters of graph mechanism, in one file each, wired into one runnable
thing: a workshop assistant that **plans** a multi-step job, **persists** its
state to Postgres after every superstep, **delegates** the parts problem to a
specialist agent, **pauses** for a human before it spends money, **streams**
its progress to a page, and **resumes** in a different process hours later
exactly where it stopped.

Assembly is mostly subtraction. What the chapter left out — `Command`, `Send`,
`interruptBefore`, a supervisor, a swarm — is not in this directory either, and
that absence is the chapter's argument rather than an oversight.

| File | What it does | Needs |
|---|---|---|
| [`state.ts`](state.ts) | Six channels, four merge behaviours. `messages` is the only one that crosses into the specialist, because a subgraph shares the channels whose **names** match and nothing else. | — |
| [`route.ts`](route.ts) | Three lines and its own file, so it can be tested with a plain object. One decision: who owns the step under the cursor. | — |
| [`nodes.ts`](nodes.ts) | `execute`, `collect`, `advance`. `collect` is the node people leave out, and leaving it out is how a delegated specialist ends up invisible in the parent's state. | — |
| [`parts.ts`](parts.ts) | The specialist, built with `createAgent`, with chapter 8's gate moved *inside* the `order_part` tool. Printed as "(1 of 2)" and "(2 of 2)"; one file here. | key |
| [`graph.ts`](graph.ts) | Seven nodes, one branch, thirteen chapters of decisions in thirty lines. `partsSpecialist.graph`, passed again in `subgraphs`. | key |
| [`build.ts`](build.ts) | The Postgres checkpointer and store, and the compiled assistant. Creates no tables. | key + Docker |
| [`hub.ts`](hub.ts) | `drive(thread, input)` — one function for a first message and for an answer. `subgraphs: true`, `durability: "sync"`, `recursionLimit: 40`, and a `getState` at the end to say *why* the stream stopped. | key + Docker |
| [`server.ts`](server.ts) | Chapter 9's router plus `/decide`. Nine lines, and they are the whole of human-in-the-loop as a web application. | key + Docker |
| [`setup-db.ts`](setup-db.ts) | `setup()` on each, once, as a deploy step. Named by the chapter, not printed by it. | key + Docker |
| [`run-examples.ts`](run-examples.ts) | **Not from the book.** The chapter's checklist, for the rows that need neither a container nor a key. The chapter default. | — |
| [`draw.ts`](draw.ts) | **Not from the book.** The checklist's last row, made runnable: the drawing generated from the compiled graph, with `xray: 1` so it descends into the specialist. | key, no Docker |
| [`assembly.test.ts`](assembly.test.ts) | **Not from the book.** Four checklist rows as assertions: three routes, one report against two steps, an idempotent `advance`, a refusal that is an outcome. | — |
| [`no-sampling.test.ts`](no-sampling.test.ts) | **Not from the book.** The build guard: a grep over the package's own `.ts` files, in `npm run verify`. | — |
| `approval.ts`, `decide.ts` | **Not from the book.** Chapter 8's `Proposal`, `Decision` and pure `decide`, imported unchanged — which is the point the chapter makes about designing a gate as a serialization boundary. | — |
| `plan.ts`, `memory.ts` | **Not from the book.** The three nodes the chapter says arrive from earlier chapters and are not reprinted: chapter 2's Opus planner, and chapter 7's `recall` and `remember`. | key |
| `sse.ts`, `events.ts`, `public/index.html` | **Not from the book.** Chapter 9's frame writer, catch-up route and thirty lines of browser, carried forward so this folder runs on its own. | key + Docker |
| `env.ts` | **Not from the book.** Two environment variables, set before anything reads them. See [below](#the-two-environment-variables). | — |
| `shop.ts` | **Not from the book.** One line: `export * from "../shop/tools.js";`, so the printed `import … from "./shop.js"` resolves. | — |

## The one that costs nothing

Three of the parent's nodes never call a model, and they are the three that
make the assembly work. So the chapter default runs on a clean clone with **no
key, no container and no network**, and prints the same thing on every machine.

```bash
npm run run-example -- ch14
```

```text
=== route: one decision, three named branches ===

cursor 0  lookup_order         work
cursor 1  check_warranty       work
cursor 2  find_parts           delegate
cursor 3  order_part           delegate
cursor 4  book_workshop_slot   work
cursor 5  notify_customer      work
cursor 6  (past the end)       finish

=== execute: the four steps the parent owns ===

execute    lookup_order: ORD-4471, frame VER-8802, bought 2025-11-03
execute    check_warranty: in cover to 2027-11-03, parts and labour

=== collect: one report, two steps recorded ===

find_parts, order_part <- one invoke

=== advance: idempotent, so a resume lands where a fresh run would ===

from cursor 0 -> 4
from cursor 4 -> 4
same landing: four steps recorded, next is book_workshop_slot
```

Read the last block twice. `advance` from cursor 0 and `advance` from cursor 4
land in the same place, and that is not a coincidence — it is the property a
resumed run needs, and it comes from writing the node as *"skip what is already
recorded"* rather than *"add one"*.

## The tests

```bash
npx vitest run ch14
```

```text
 Test Files  2 passed (2)
      Tests  6 passed (6)
```

Six tests, no key, no container, milliseconds. Four are checklist rows;
two are the build guard, which greps every `.ts` file in this package for
`temperature:`, `top_p:` or `top_k:` and fails the build if it finds one.
`claude-sonnet-5` and `claude-opus-5` both return a 400 for a non-default
sampling parameter and the SDK type-defines all three anyway, so a listing that
sets one compiles clean and fails in production. The second test asserts the
walk actually reached the listings, because a grep that finds nothing passes.

## Monday morning

Four commands, in this order. Only the last two need a key.

```bash
npm run db:up                                  # Postgres on 127.0.0.1:5433
npm run run-example -- ch14/setup-db           # once, as a deploy step
npm run run-example -- ch14/server             # http://127.0.0.1:8787
open http://127.0.0.1:8787
```

Type the Verano question into the box — *"My Verano hybrid is under warranty and
the rear hub is grinding. Can you sort it?"* — and the page fills in as the
graph works, with the specialist's events indented under the step that
delegated them:

```text
recall     known=2 facts about this customer
plan       lookup_order, check_warranty, find_parts,
           order_part, book_workshop_slot, notify_customer
execute    lookup_order: ORD-4471, frame VER-8802
execute    check_warranty: in cover to 2027-11-03
  parts    find_parts -> HUB-VR-142, Coldharbour, GBP 68.40
  parts    order_part -> waiting
paused     Order HUB-VR-142 from Coldharbour Distribution
           for GBP 68.40.
```

Then **stop the server**. Close the laptop, deploy over it, take the weekend.
The thread is a set of rows in Postgres holding the state after `find_parts`,
plus a pending write recording that a person owes an answer. Start the server
again — a different process, which has never seen this job — and answer:

```bash
curl -X POST "http://127.0.0.1:8787/decide?thread=THREAD_ID" \
     -d '{"type":"approve"}'
```

`202`, not `200`: the request has accepted the decision, it has not completed
the run. The rest arrives over the event stream the browser is already
subscribed to.

```text
  parts    order_part -> ordered HUB-VR-142, ref PO-1001
collect    find_parts, order_part recorded
execute    book_workshop_slot: Thursday, 09:00
execute    notify_customer: draft written, not sent
remember   1 fact written
end
```

Two things in those two blocks are the book. The second one starts *inside* the
specialist's `order_part` tool — the graph resumed inside a subgraph inside a
tool call, in a process that had never seen this job. And `collect` fires once
for two steps, which is the delegation boundary showing up in the state exactly
where it was drawn.

Reject instead — `{"type":"reject","reason":"Customer wants a quote first."}` —
and the run is the same length and buys nothing. The tool returns the decline
note, `collect` records it against both parts steps, `route` sends the run on,
and `notify_customer` drafts a message that says what did not happen. A refused
approval is an outcome the graph carries, not an exception it throws.

### The three frames on the wire

Whatever the browser does, the wire is four routes and five event names, and
you can watch them with `curl`. This is a real transcript with a deliberately
invalid key, which is the cheapest way to see the third of the three endings:

```bash
curl -s -X POST "http://127.0.0.1:8787/runs?q=hub%20grinding"
# {"thread":"5a7fa1ec-da84-496a-8312-9d703914b630"}

curl -N "http://127.0.0.1:8787/events?thread=5a7fa1ec-…"
```

```text
retry: 2000

event: snapshot
data: {"cursor":0,"next":[]}

event: updates
data: {"ns":[],"data":{"recall":{"known":[]}}}

event: failed
data: {"message":"Error: 401 …invalid x-api-key…"}
```

`snapshot` is the catch-up frame, read from the checkpoint rather than from a
buffer of events. `ns` is empty for the parent and names the task for anything
inside the specialist, which is what `subgraphs: true` buys and what lets a UI
indent. And the stream ends with one of exactly three frames — `end`, `failed`
or `paused` — because the end of an iteration carries no information about why
it ended, and only your code can say.

## The two environment variables

**`ANTHROPIC_API_KEY`.** Building the assistant constructs two chat models at
module scope, Opus in `plan.ts` and Sonnet in `parts.ts`, so anything that
imports `build.ts` needs a key — including `setup-db.ts`, which imports it for
the two objects whose tables it creates. `env.ts` says so in one sentence
instead of letting the SDK throw from inside `node_modules`.

**`PLANS_DATABASE_URL`.** The printed `build.ts` reads `DATABASE_URL`, which is
the right name in an application that owns its own database and the wrong name
here: Book 2 already publishes a Postgres on 5432 under it. So `env.ts` maps
`PLANS_DATABASE_URL` onto `DATABASE_URL` before `build.ts` can read it,
defaulting to `postgresql://braxby:braxby@localhost:5433/braxby`, and the
printed line stands exactly as the page has it. It is a separate module rather
than two lines at the top of `build.ts` because ES modules are evaluated in the
order their imports appear, and that is the only hook available above a
printed first statement.

## Two traps this directory has already stepped in

**A customer id may not contain `_`.** `PostgresStore` rejects a namespace
label containing `_` or `%` outright, because they are SQL LIKE wildcards and a
prefix search would match namespaces outside the prefix. Chapter 7's
`cust_4417` works perfectly against the `InMemoryStore` that chapter used and
fails here, so this build says `cust-4417`. Worse, the failure arrives from the
store's own batch queue rather than from the run, so it is an unhandled
rejection that takes the process down instead of a `failed` frame the browser
can read — `drive`'s `try`/`catch` never sees it.

**`durability` is not the default.** A run that has ordered a hub and then lost
the checkpoint recording that it did will, on resume, propose the same purchase
to a second human, and the hub gets bought twice. `"sync"` writes the
checkpoint at the superstep boundary and waits for it. The cost is one round
trip to Postgres per superstep; the alternative is a duplicate order.

## The checklist

The chapter ends with fourteen rows to run against your own build. Four of them
are `npm run run-example -- ch14` and `npx vitest run ch14` above.

**The row nobody runs is the last one**, so it has a file. It spends nothing,
calls no model and does not need Postgres up — but the key has to be *present*,
because building the assistant constructs two chat models:

```bash
npm run run-example -- ch14/draw
```

```text
%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	recall(recall)
	plan(plan)
	execute(execute)
	parts___start__(<p>__start__</p>)
	parts_model_request(model_request)
	parts_tools(tools)
	parts___end__(<p>__end__</p>)
	collect(collect)
	advance(advance)
	remember(remember)
	__end__([<p>__end__</p>]):::last
	__start__ --> recall;
	collect --> advance;
	execute --> advance;
	parts___end__ --> collect;
	plan --> advance;
	recall --> plan;
	remember --> __end__;
	advance -. &nbsp;work&nbsp; .-> execute;
	advance -. &nbsp;delegate&nbsp; .-> parts___start__;
	advance -. &nbsp;finish&nbsp; .-> remember;
	subgraph parts
	parts___start__ --> parts_model_request;
	parts_tools --> parts_model_request;
	parts_model_request -.-> parts_tools;
	parts_model_request -.-> parts___end__;
	end
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
```

Seven parent nodes, the router's three named branches drawn as dotted edges
with their labels on them, and the specialist as a real subgraph with its own
`model_request`/`tools` loop inside it. That last part is what
`{ subgraphs: [parts] }` bought: drop it and the whole delegation collapses
into one opaque box. Put this next to the picture in your head — on a
seven-node graph they will match, and that is the point of doing it now,
before the twenty-node graph where they will not.

One row cannot be run from this directory at all, and it is the one that fails
most often and latest: **the graph survives a redeploy.** Replace the
container, not the process. A file-backed checkpointer passes every restart
test you will run locally and evaporates the first time the image is replaced.
