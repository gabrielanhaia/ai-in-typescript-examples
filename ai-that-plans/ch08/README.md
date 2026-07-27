# ch08 — Human in the loop: interrupt and resume

A hard stop in the machine in front of the one step in the canonical task
that cannot be undone by running the graph again: `order_part`, which posts
to a supplier's API and after which the shop has bought a hub.

The pause is a checkpoint with a question attached. The run ends, the process
is free to exit, and the answer arrives later — from another terminal, on
another day — as an `approve`, an `edit` or a `reject`.

**No node in this chapter calls a model.** The shop's services sit behind the
plain functions in [`shop.ts`](shop.ts), so every listing here prints the same
thing on every machine and the only variable is the human. Nothing in this
directory needs `ANTHROPIC_API_KEY`, and nothing needs Docker.

| File | What it does | Needs |
|---|---|---|
| [`state.ts`](state.ts) | Chapter 5's state, restructured around the one gated step. `Part` carries the supplier and the price, because a person being asked to approve a purchase needs both. | — |
| [`approval.ts`](approval.ts) | The two shapes the gate is made of: `Proposal` out to the human, `Decision` back. Both cross a process and a serialization boundary. | — |
| [`decide.ts`](decide.ts) | The branch, as a pure function on plain values with nothing imported from LangGraph. Three answers in, an `Outcome` out. | — |
| [`order-part.ts`](order-part.ts) | The node that spends the money. `interrupt<Proposal, Decision>` sits near the top and `placeOrder` sits below it, and that order is the chapter. | — |
| [`graph.ts`](graph.ts) | Chapter 5's graph with `order_part` able to end in two places, so the node declares its `ends` to the builder. | — |
| [`pause.ts`](pause.ts) | Half one: run to the gate and stop. Reads the pending question twice — from `invoke`'s return value, then from the store. | — |
| [`resume.ts`](resume.ts) | Half two: `approve`, `edit` or `reject` into the same `thread_id`, from a different process. | — |
| [`pending.ts`](pending.ts) | The one function an approvals UI needs: a thread's open question, read out of the checkpointer. A module — nothing in the chapter runs it. See below for a one-liner that does. | — |
| [`replay.ts`](replay.ts) | Four lines of instrumentation proving the node body runs twice for one pause. Self-contained: its own two-field state, its own `MemorySaver`. | — |
| [`before.ts`](before.ts) | The other pause. `interruptBefore` at compile time, on a node that has no idea it is being gated — and nothing at all to show the reviewer. | — |
| [`gate.test.ts`](gate.test.ts) | Two tests, no key, no network, milliseconds. The edit branch reaches the world; the run stops before the supplier is called. | — |
| `checkpointer.ts` | **Not from the book.** Chapter 6's factory, which this chapter uses unchanged and imports as `./checkpointer.js`. `"memory"` or `"sqlite"`. | — |
| `shop.ts` | **Not from the book.** One line: `export * from "../shop/tools.js";`, so the printed `import … from "./shop.js"` resolves. | — |

## Run it

Every command below runs with **no API key and no container**.

```bash
npm run run-example -- ch08/pause          # stop at the gate
npm run run-example -- ch08/resume approve # …and answer it, later
npm run run-example -- ch08/resume edit
npm run run-example -- ch08/resume reject
npm run run-example -- ch08/replay         # one pause, two executions
npm run run-example -- ch08/before         # the configured pause
npx vitest run ch08/gate.test.ts           # the two gate tests
```

`pause` and `resume` share `thread_id: "wr-4471"` through
`data/braxby.sqlite`, which is the whole point: run them in two different
terminals, or on two different days. `resume` on its own, against a store
that has no pending interrupt, is the failure the chapter warns about —
see below.

To start over, delete the file:

```bash
rm -f data/braxby.sqlite
```

## Expected output

### `ch08/pause`

```text
awaiting: Order Verano rear hub, 142mm (HUB-VR-142) from Coldharbour Distribution for GBP 68.40.
interrupt id: d55e9dfe694875e07f87d803defafdcf
next: order_part
open: 1
```

The book wraps that first sentence across two lines to fit the page; the
program prints it as one. **The interrupt id is a hash and is different on
every run** — the book's `91b036eb…` and the `d55e9dfe…` above are the same
thing, and neither is the one you will see. What is stable is that there is
exactly one of them, and that it is the value you would put in the link you
email so a click on yesterday's message cannot answer today's question.

### `ch08/resume approve`

```text
orderRef: PO-1001
note: (none)
done: find_parts -> order_part -> book_workshop_slot -> notify_customer
```

### `ch08/resume edit`

Byte-identical to `approve`, and that is the point — the run goes exactly as
far and buys something else, because `decide` took the human's `HUB-VR-142-B`
from Marchmont Wheelworks instead of the proposal's hub. The reference is the
same `PO-1001` because each `run-example` is a fresh process and the fixture's
counter starts over.

### `ch08/resume reject`

```text
orderRef: (none)
note: Order declined: Customer wants a quote first.
done: find_parts -> notify_customer
```

`order_part` never appears in `done`, `orderRef` is empty, and the run did not
stop — it went to `notify_customer` with a reason attached. A rejection is a
route, not an exception.

### `ch08/resume approve`, run a second time

```text
orderRef: PO-1001
note: (none)
done: find_parts -> order_part -> book_workshop_slot -> notify_customer
```

Unchanged. The thread has moved past the pause, the second answer is ignored,
and a double-clicked approval link does not buy two hubs. That holds because
the first resume completed; it is not a lock.

### `ch08/resume approve` against a store with no pending interrupt

Delete `data/braxby.sqlite` first, or mistype the thread id:

```text
orderRef: (none)
note: (none)
done:
```

No error. The graph wrote a checkpoint, ran no node, and returned default
state. Every lost store and every mistyped thread id looks like a job that
finished instantly, which is why the chapter tells you to read
`getState().tasks` before you send the answer.

### `ch08/replay`

```text
node body entered 1 time(s)
node body entered 2 time(s)
one pause, 2 executions
```

One pause, two executions of the node body. Nothing above an `interrupt` call
may have an effect.

### `ch08/before`

```text
paused? true
payload: []
next: [ 'order_part' ]
part: "HUB-VR-142"
orderRef: PO-1001
```

`payload: []`. The run is paused, `isInterrupted` agrees, and there is nothing
to read — no proposal, no summary, no price. Run this and `ch08/pause` back to
back and put the two terminals side by side; that difference is the chapter's
comparison table.

### `npx vitest run ch08/gate.test.ts`

```text
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

The second test is the one that matters. Asserting the run paused proves the
gate is wired up; asserting `supplier.ordersPlaced` did not move proves the
gate is *in front of* the thing it guards, which is the claim that breaks when
somebody reorders two lines in the node.

### `pendingFor`, from [`pending.ts`](pending.ts)

Nothing in the chapter calls it — it is the function you would call from a web
server rendering an approvals page. With a thread paused by `ch08/pause`:

```bash
node --import tsx --input-type=module -e '
import { openCheckpointer } from "./ch08/checkpointer.js";
import { buildGraph } from "./ch08/graph.js";
import { pendingFor } from "./ch08/pending.js";
console.log(await pendingFor(buildGraph(openCheckpointer("sqlite")), "wr-4471"));
'
```

```text
{
  threadId: 'wr-4471',
  node: 'order_part',
  interruptId: 'ac8a02280a0235fb2127994f58f81f36',
  proposal: {
    action: 'order_part',
    summary: 'Order Verano rear hub, 142mm (HUB-VR-142) from Coldharbour Distribution for GBP 68.40.',
    code: 'HUB-VR-142',
    supplier: 'Coldharbour Distribution',
    priceGbp: 68.4,
    frameNumber: 'VER-8802'
  },
  waitingSince: '2026-07-27T22:48:45.048Z'
}
```

Pass a thread id with nothing pending and it prints `null`. The id and the
timestamp are different on your machine.

## What is here that the book does not print

**`checkpointer.ts`.** The chapter says `openCheckpointer` is "chapter 6's
factory, unchanged" and imports it from `./checkpointer.js`. It is copied into
this directory rather than reached for across directories, so the printed
import path is the true one and the folder reads on its own. Two stores only —
`"memory"` and `"sqlite"` — because those are the two the chapter's listings
ask for.

**`shop.ts`.** One line. The printed listings import `placeOrder`, `findHub`
and `bookSlot` from `./shop.js`; the fixtures live in
[`../shop/tools.ts`](../shop/tools.ts).

**The file around the two `it` blocks.** The book prints the two tests and not
`gate.test.ts`'s imports or its `proposal` fixture. Those are here and nothing
else is.

## Where this differs from the page

**`supplier.ordersPlaced`.** The second printed test opens with
`const spent = supplier.ordersPlaced` and the book never prints where
`supplier` comes from. It is a counter exported by
[`../shop/tools.ts`](../shop/tools.ts) alongside the existing `resetFlakiness`
seam, incremented by `placeOrder` when it issues a new reference. Counting
placements rather than calls is deliberate: `placeOrder` is idempotent per
part and supplier, so a resumed run cannot order twice.

**The fixture had to move to match the book.** `../shop/tools.ts` shipped a
hub with no `name`, coded `HB-118` from Fettle Components, and an order
counter starting at zero. The chapter's `Part` schema requires `name`, its
approval sentence prints `Verano rear hub, 142mm (HUB-VR-142)` from
`Coldharbour Distribution`, and both this chapter and chapter 14 print
`PO-1001` as the first reference. The fixture now carries all four, and its
counter starts at 1000.

**`pending.ts` has no runner.** The chapter introduces `pendingFor` as the one
function an approvals UI needs and never calls it, so neither does this
directory. The one-liner above is how you see it work.

**What you cannot do.** Call `orderPart(state)` directly in a test. `interrupt`
reads the run's context out of async local storage and throws
`Called interrupt() outside the context of a graph.` when there isn't one.
Test the node through the graph, and test the decision through `decide`.
