# ch09 — Streaming graph state to a UI

One run, eight projections of it, and the two that a customer-facing UI
actually wants. Then those events over Server-Sent Events into about thirty
lines of browser with no framework in them, through a hub that outlives the
request that started the run.

**No node in this chapter calls a model.** The six steps sit behind the plain
functions in [`shop.ts`](shop.ts) and [`suppliers.ts`](suppliers.ts), so every
listing prints the same thing on every machine — which is the only way a
chapter about *watching* a run can tell you what to expect. Nothing in this
directory needs `ANTHROPIC_API_KEY`, Docker, or a network.

| File | What it does | Needs |
|---|---|---|
| [`first-stream.ts`](first-stream.ts) | `invoke` swapped for `stream`. One line per superstep, keyed by node name. | — |
| [`measure.ts`](measure.ts) | The same work streamed four ways, counted: events, total bytes, mean event. | — |
| [`progress.ts`](progress.ts) | The mode you design yourself: `find_parts` instrumented with `runtime.writer`, declared inline on the builder so the second argument is typed. A builder — nothing runs it. | — |
| [`sse.ts`](sse.ts) | `frame()` and `openStream()`. A dozen lines, and the blank line that commits a frame. | — |
| [`hub.ts`](hub.ts) | Both printed halves, in file order: `subscribe`/`unsubscribe`/`publish`, then `startRun`, which is never awaited by a request handler. | — |
| [`events.ts`](events.ts) | `GET /events`: open, subscribe, unsubscribe on `close`, and one `snapshot` frame read out of the checkpoint. | — |
| [`server.ts`](server.ts) | The router and nothing more. `POST /runs` starts one; `GET /events` subscribes to one. | — |
| [`public/index.html`](public/index.html) | The whole UI. No build step, no framework, no bundler. | — |
| [`encoded.ts`](encoded.ts) | `encoding: "text/event-stream"` — the framework formatting the frames for you. A module; nothing in the chapter calls it. See below for a one-liner that does. | — |
| `graph.ts` | **Not from the book.** `assistant`, which five printed listings import and none of them print. Chapter 5's six nodes in a line, with `find_parts` instrumented exactly as `progress.ts` prints it. | — |
| `state.ts` | **Not from the book.** `PlanState`, reduced to the three channels the printed listings use: `messages`, `cursor`, `results`. | — |
| `suppliers.ts` | **Not from the book.** `SUPPLIERS` and `searchSupplier` — what `find_parts` is doing while it is "three suppliers deep and still looking". | — |
| `shop.ts` | **Not from the book.** One line: `export * from "../shop/tools.js";`, so both printed import forms resolve. | — |

## Run it

Every command below runs with **no API key and no container**.

```bash
npm run run-example -- ch09/first-stream   # updates, one line per superstep
npm run run-example -- ch09/measure        # four modes, four sets of numbers
npm run run-example -- ch09/server         # then open http://127.0.0.1:8787
```

The graph takes about 2.4 seconds end to end: six steps at 200 ms each, and a
`find_parts` that also visits three suppliers at 400 ms each. Those delays are
fixtures, and the reason they exist is in *Where this differs from the page*
below.

## Expected output

### `ch09/first-stream`

```text
lookup_order {"results":{"lookup_order":"ORD-4471, frame VER-8802, bought 2025-11-03"},"cursor":1}
check_warranty {"results":{"check_warranty":"in cover to 2027-11-03, parts and labour"},"cursor":2}
find_parts {"results":{"find_parts":"HUB-VR-142, HUB-VR-142-B"},"cursor":3}
order_part {"results":{"order_part":"refused: a human decides this one"},"cursor":4}
book_workshop_slot {"results":{"book_workshop_slot":"next free bay: Thursday, 09:00"},"cursor":5}
notify_customer {"results":{"notify_customer":"draft written, not sent"},"cursor":6,"messages":{"lc":1,...}}
```

Six lines, one per superstep, each keyed by the node that produced it. The
last one is printed here truncated: step six writes a message as well as a
result, and a serialized `AIMessage` is roughly 400 characters of envelope
around 130 characters of text — which is `updates` being honest about being
"proportional to what changed". Its `id` is a fresh UUID on every run, and it
is the only part of this output that differs between machines.

### `ch09/measure`

```text
values 7 3367 481
updates 6 930 155
checkpoints 8 8730 1091.25
tasks 12 4864 405.3333333333333
```

Mode, events, total bytes, mean event. Read the totals: `checkpoints` is
**9.4×** the size of `updates` on this graph, and `tasks` is 5.2×. The event
counts are the clock the chapter describes — 6 supersteps means 6 `updates`,
7 `values` (the input checkpoint gets a frame too), 8 `checkpoints`, and 12
`tasks`, which is twice per node because a task is reported starting and then
finishing.

These four numbers are reproducible on any machine: no model, no clock, and
the only variable-looking things in the payloads (UUIDs, ISO timestamps) are
fixed-width.

The chapter's exercise is to add `"messages"` to `MODES`. Here it prints:

```text
messages 1 784 784
```

**One event, not hundreds.** That is not the mode misbehaving — it is this
graph having no model in it, so the only thing `messages` has to report is the
one `AIMessage` step six writes into state. On a graph whose node calls a
`ChatAnthropic`, this is the row with several hundred tiny events and the
largest total on the page. Point `measure.ts` at `ch06/graph.ts` if you want
to see that number rather than read about it.

### `ch09/server`

```bash
npm run run-example -- ch09/server
```

Then open <http://127.0.0.1:8787>, type the Verano question, and press Send.
The list fills in over about two seconds:

```text
at step 0
done: lookup_order
done: check_warranty
find_parts start
find_parts Coldharbour Distribution
find_parts Marchmont Wheelworks
find_parts Fettle Components
find_parts done
done: find_parts
done: order_part
done: book_workshop_slot
done: notify_customer
```

Twelve lines from three kinds of frame: one `snapshot`, six `updates`, five
`custom`. The five in the middle are the ones no other mode can produce — the
graph knows `find_parts` started and finished, and only the node itself knows
which supplier it is on.

The frames behind that list, if you would rather watch them as text:

```bash
curl -s -X POST 'http://127.0.0.1:8787/runs?q=hub%20grinding'
# {"thread":"40028f7e-fa4b-450c-ae80-8da4b4fe47bb"}
curl -sN 'http://127.0.0.1:8787/events?thread=40028f7e-fa4b-450c-ae80-8da4b4fe47bb'
```

```text
retry: 2000

event: snapshot
data: {"cursor":0,"next":["lookup_order"]}

event: updates
data: {"lookup_order":{"results":{"lookup_order":"ORD-4471, frame VER-8802, bought 2025-11-03"},"cursor":1}}

event: custom
data: {"node":"find_parts","supplier":"Coldharbour Distribution"}

…

event: end
data: {"thread":"40028f7e-fa4b-450c-ae80-8da4b4fe47bb"}
```

`curl` will sit there after `end`, because the server does not close the
response — the client does, which is what the two `close()` listeners at the
bottom of the page are for. Press ctrl-C.

## The four exercises

**Kill the tab mid-run.** Start a run, close the tab a second in, then open
`/events?thread=<the id the POST returned>` in a fresh tab. One second in:

```text
event: snapshot
data: {"cursor":2,"next":["find_parts"]}
```

After the run has finished:

```text
event: snapshot
data: {"cursor":6,"next":[]}
```

The run reached `notify_customer` with nobody subscribed, and the reconnect
read that out of the checkpoint rather than out of a replay buffer. What it
cannot give you back is the `custom` events you missed while you were gone:
they were transport, never state.

**Delete the two `close()` listeners.** Watch the network panel reopen
`/events` every two seconds, forever, after the run is over. That interval is
the `retry: 2000` line `openStream` writes.

**Swap `streamMode: ["updates", "custom"]` for `"updates"` in `hub.ts`.** The
destructure in `startRun` stops compiling before anything runs:

```text
ch09/hub.ts(37,22): error TS2488: Type '{ book_workshop_slot?: { results: …
} | undefined; … }' must have a '[Symbol.iterator]()' method that returns an
iterator.
```

One mode is the bare payload; an array of modes is a tuple. Change it back.

**`pipeRun`, from [`encoded.ts`](encoded.ts).** Nothing in the chapter calls
it, because it is the shape this chapter's architecture is an argument
against. It resumes a thread — `stream(null, …)` — so it needs one with
something pending. Chapter 5's drain makes one:

```bash
node --import tsx --input-type=module -e '
import { RunControl, isGraphDrained } from "@langchain/langgraph";
import { assistant } from "./ch09/graph.js";
import { pipeRun } from "./ch09/encoded.js";
const res = { writeHead() {}, write: (c) => process.stdout.write(Buffer.from(c)), end() {} };
const control = new RunControl();
setTimeout(() => control.requestDrain("demo"), 10);
try {
  await assistant.invoke({ messages: [{ role: "user", content: "hub grinding" }] },
    { configurable: { thread_id: "enc-1" }, control });
} catch (err) { if (!isGraphDrained(err)) throw err; }
await pipeRun(res, "enc-1");
'
```

```text
retry: 2000

event: updates
data: {"check_warranty":{"results":{"check_warranty":"in cover to 2027-11-03, parts and labour"},"cursor":2}}

event: custom
data: {"node":"find_parts","phase":"start"}

event: custom
data: {"node":"find_parts","supplier":"Coldharbour Distribution"}

…

event: updates
data: {"notify_customer":{"results":{"notify_customer":"draft written, not sent"},"cursor":6,"messages":{…}}}
```

Already-formatted frames, as bytes, with the event name set to the stream
mode. The drain is requested 10 ms in, which lands inside `lookup_order`, so
the run stops at the boundary after it and the resume picks up at
`check_warranty`. Three things to notice: the frames stop at the last
`updates` — there is no `end` — there is no `id:` field, and there is no room
for a `snapshot` frame either, because the event names are the mode names.
That is the whole of the chapter's argument for formatting them by hand.

Point the same call at a thread that has never run and it throws
`EmptyInputError: Received no input writes for "__start__"`. `null` means
resume, and there is nothing to resume.

## What is here that the book does not print

**`graph.ts`.** Five listings import `assistant` from `./graph.js` and the
chapter never prints it, because it is chapter 5's graph and the chapter says
so: "The graph has not changed. The nodes are the same nodes." Two things in
it are this chapter's, and both are things the chapter states:

- `find_parts` is the node from [`progress.ts`](progress.ts), body unchanged,
  because the browser client renders `d.node + " " + (d.supplier ?? d.phase)`
  and something has to emit those events.
- There is no interrupt. Chapter 8 gates `order_part`; this chapter says "the
  run reaches `notify_customer` regardless", so it does. Streaming an
  interrupt is described in *Two ways a stream ends that are not the end* and
  demonstrated in `ch08`, not here.

The checkpointer is a `MemorySaver` — one process, which is the same process
the hub's `Map` of subscribers lives in. A browser that reconnects is reading
a checkpoint written by the run it lost, and that works. A second server
process would see neither the checkpoints nor the subscribers, which is the
chapter's own note about a hub that works across processes being a deployment
problem.

**`state.ts`.** `PlanState`, cut down to the three channels the printed
listings touch: `messages` (every listing starts a run with one), `cursor`
(written by `progress.ts`, read by `events.ts`) and `results` (written by
`progress.ts`). Chapter 3's `plan` and `signal` channels are not here because
nothing in this chapter uses them.

**`suppliers.ts`.** `SUPPLIERS` and `searchSupplier`, which `progress.ts`
imports and the book does not print. Three suppliers, a fixed catalogue, one
at a time. `HUB-VR-142` from Coldharbour Distribution is the hub the rest of
the book knows about; `HUB-VR-142-B` from Marchmont Wheelworks is the
alternative chapter 8's human edits to; Fettle Components stocks neither,
which is why a third supplier is worth visiting.

**`shop.ts`.** One line, so `import … from "./shop.js"` resolves to
[`../shop/tools.ts`](../shop/tools.ts).

## Where this differs from the page

**Every node takes 200 ms, and a supplier lookup takes 400 ms.** The book
prints no delays because it is describing a graph whose steps call a supplier,
a diary and a warranty table. The fixtures here return instantly, and without
the delays five of the six supersteps land inside the same millisecond: the
browser's first frame reports a run that is already half over, and every
`custom` event arrives after the node that emitted them has finished. The
numbers are in `graph.ts` (`STEP_MS`) and `suppliers.ts` (`SEARCH_MS`), and
they are the same instrument as chapter 5's `STEP_MS` env var.

**`"messages"` has almost nothing to report here.** The chapter's fifth run is
the one that shows a mode with many tiny events adding up to the largest total
on the wire. That needs a model, and this chapter's graph deliberately has
none — see the `ch09/measure` section above for the number you actually get
and what to point it at instead.

**Nothing here calls a model at all**, including step six, which the chapter
describes as drafting a customer message. It drafts one — from the results the
five steps before it wrote, in `graph.ts`'s `draft()`. That keeps `values`
frames growing the way the chapter says they do (the transcript is in state
and state is in every frame) without making a chapter about streaming depend
on a key.

**`progress.ts` is a builder, not a graph.** The book prints
`new StateGraph(PlanState).addNode("find_parts", …)` with no `.compile()`, and
that is what is here. It exists to be read and to typecheck; the same node
body, running, is in `graph.ts`.

## One thing to read twice

`hub.ts` is one file containing both printed blocks in the order they appear
in the chapter, which puts `import { assistant } from "./graph.js";` in the
middle of the file rather than at the top. That is legal — ES module imports
are hoisted and may appear anywhere at the top level — and it is left exactly
as printed so the file matches the page. It is not a style to copy.
