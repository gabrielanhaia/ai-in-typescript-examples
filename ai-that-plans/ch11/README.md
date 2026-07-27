# ch11 — Multi-agent: supervisor and handoff

The same four specialists wired up twice — once around a coordinator, once
straight to each other — plus the instrument that tells you what the split
cost on your machine.

Four groups, four bodies of knowledge, no tool in two places:

| Specialist | Tools |
|---|---|
| `orders` | `lookup_order` |
| `warranty` | `check_warranty` |
| `parts` | `find_parts`, `order_part` |
| `scheduling` | `book_workshop_slot`, `notify_customer` |

**Almost everything in this directory is a module.** One file runs:
[`compare.ts`](compare.ts), and it needs `ANTHROPIC_API_KEY`. The rest export
graphs and functions, and the section below gives a one-liner for each so you
can see it work.

| File | What it does | Needs |
|---|---|---|
| [`specialists.ts`](specialists.ts) | The four briefs, and `build(extra)` — one set of briefs serving two topologies. Printed in the book in two blocks; it is one file. | key to import |
| [`supervisor.ts`](supervisor.ts) | `createSupervisor`, Opus in the middle and Sonnet around it. Returns an **uncompiled** builder, so the `MemorySaver` goes on in `compile()`. | key to import |
| [`handoffs.ts`](handoffs.ts) | `peersOf(self)` — one `transfer_to_<name>` tool per peer, from the **swarm** package's `createHandoffTool`, not the supervisor's. | key to import |
| [`swarm.ts`](swarm.ts) | `createSwarm`. No coordinator, so nothing here is bound to `claude-opus-5`. | key to import |
| [`router.ts`](router.ts) | The same swarm without the factory: `SwarmState`, `addActiveAgentRouter`, and edges derived from the agents' own handoff tools by `getHandoffDestinations`. | key to import |
| [`usage.ts`](usage.ts) | `Cost`, `empty()` and `add()`. The counting rule: sum `usage_metadata` over every `AIMessage` in every namespace, de-duplicated by message id. | — |
| [`measure.ts`](measure.ts) | One run, streamed with `subgraphs: true` so the specialists' internal messages are counted at all. Returns the four counters plus `ms`. | — |
| [`single.ts`](single.ts) | The baseline: one agent, all six tools, one prompt. | key to import |
| [`nested.ts`](nested.ts) | A compiled agent as a node. `partsGraph` has no checkpointer of its own, so it writes into the parent's chain under this thread. | key to import |
| `compare.ts` | **Not printed.** The chapter names it and describes it: the three graphs, three calls to `measure`, three rows. | key |
| `shop.ts` | **Not printed.** One line: `export * from "../shop/tools.js";` | — |

"Needs key to import" is literal and it bites early: `specialists.ts`
constructs its `ChatAnthropic` at module scope, so importing any file that
reaches it without a key throws `Anthropic API key not found` before a line of
your own code runs. That is the whole reason `compare.ts` checks the
environment first and then `await import`s — a static import is hoisted above
the check.

## Run it

The one runnable file:

```bash
npm run run-example -- ch11/compare
```

Equivalently, without the runner: `npx tsx ch11/compare.ts`.

With no key it stops before importing anything, in one line:

```text
ANTHROPIC_API_KEY is not set. This example runs three teams against the model — set the key in ../.env or the environment and run it again.
```

Exit code 1. Nothing was constructed and nothing was sent.

### Expected output

Three rows, one per topology, in the order the chapter reads them — the single
agent first, because it is the baseline:

```text
topology     messages     input    output cacheRead        ms
single             ..        ..        ..        ..        ..
supervisor         ..        ..        ..        ..        ..
swarm              ..        ..        ..        ..        ..
```

**The numbers are not printed here because there are no correct ones.** A
team's message count is not deterministic — it depends on how many turns each
specialist takes — and the token and clock columns follow the message count.
Two runs of the same topology differ. That is the chapter's point, not a
defect: the only numbers that describe your job are the ones your own run
prints, which is why the chapter builds the instrument instead of quoting a
table.

What *is* structural, and what you should be able to see in your own rows:

- The two team rows are **larger than the single row in `messages`.** Everything
  the single agent does, both topologies also do, and then add the hop
  bookkeeping — five parent-transcript messages per supervisor delegation, of
  which four are bookkeeping; two per swarm transfer.
- The supervisor's `input` grows fastest, because the coordinator re-reads the
  transcript on every one of its turns, and there is one more of those than
  there are specialists — one to dispatch each, one to write the final answer.
- `cacheRead` is worth as much attention as `input`. A large stable prefix is
  billed at the cache rate after the first step, so a growing `input` column
  beside a growing `cacheRead` column is a different bill from a growing
  `input` column on its own.
- `ms` does not track tokens. Every hop is a round trip, and neither topology
  runs two specialists at once — the supervisor dispatches one handoff per
  turn, the swarm has exactly one `activeAgent`. Added latency, never
  overlapped latency.

## Seeing the modules work

### `usage.ts` — the counting rule, with no key and no model

The de-duplication is the part worth watching: the same `AIMessage` surfaces in
both the specialist's namespace and the parent's, and is paid for once.

```bash
node --import tsx --input-type=module -e '
import { add, empty } from "./ch11/usage.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
const total = empty();
const seen = new Set();
const ai = new AIMessage({
  id: "run-1",
  content: "ok",
  usage_metadata: {
    input_tokens: 900, output_tokens: 40, total_tokens: 940,
    input_token_details: { cache_read: 800 },
  },
});
add(total, seen, [new HumanMessage("hello"), ai]);
add(total, seen, [ai]);            // the same message, a second namespace
console.log(total);
'
```

```text
{ messages: 2, input: 900, output: 40, cacheRead: 800 }
```

Two messages, not three. Drop the `id` and it counts three — which is correct
too, because a message with no id was made locally and appears only once.

### The four graphs — built, without spending anything

Constructing a graph makes no request, so any string in `ANTHROPIC_API_KEY` is
enough to get past the constructor. The value below is not a key and reaches
nothing; it exists so you can inspect the wiring for free.

```bash
ANTHROPIC_API_KEY=sk-ant-not-a-real-key node --import tsx --input-type=module -e '
const { supervised } = await import("./ch11/supervisor.js");
const { swarmed } = await import("./ch11/swarm.js");
const { routed } = await import("./ch11/router.js");
const { nested } = await import("./ch11/nested.js");
for (const [label, g] of [["supervisor", supervised], ["swarm", swarmed],
                          ["router", routed], ["nested", nested]]) {
  console.log(label.padEnd(11), Object.keys((await g.getGraphAsync()).nodes).join(" "));
}
'
```

```text
supervisor  __start__ supervisor orders warranty parts scheduling
swarm       __start__ orders warranty parts scheduling
router      __start__ orders warranty parts scheduling
nested      __start__ parts __end__
```

Read the first two lines against each other: the supervisor has a node the
swarm does not, and that node is the topology. Read the second and third: they
are identical, which is the section's claim — `createSwarm` is a convenience
over `SwarmState` plus `addActiveAgentRouter`, and `router.ts` builds the same
graph by hand.

### `handoffs.ts` — the edges come from the tools

```bash
ANTHROPIC_API_KEY=sk-ant-not-a-real-key node --import tsx --input-type=module -e '
const { peersOf } = await import("./ch11/handoffs.js");
const { build } = await import("./ch11/specialists.js");
const { getHandoffDestinations } = await import("@langchain/langgraph-swarm");
console.log("peersOf(\"orders\"):", peersOf("orders").map((t) => t.name).join(" "));
for (const a of build(peersOf))
  console.log(String(a.graph.name).padEnd(11), "->", getHandoffDestinations(a.graph).join(" "));
console.log("with build(() => []):", getHandoffDestinations(build(() => [])[0].graph));
'
```

```text
peersOf("orders"): transfer_to_warranty transfer_to_parts transfer_to_scheduling
orders      -> warranty parts scheduling
warranty    -> orders parts scheduling
parts       -> orders warranty scheduling
scheduling  -> orders warranty parts
with build(() => []): []
```

Nothing restates the topology anywhere. `getHandoffDestinations` opens the
compiled agent, finds the node called `tools`, and reads the `agentName` off
every tool carrying `__handoff_destination`. Give a specialist one fewer
transfer tool and it loses an edge, silently, at runtime — the last line is
that same fact at its limit: the supervisor's specialists, built with
`build(() => [])`, have no destinations at all, because in that topology the
coordinator owns every edge.

### `single.ts`, `measure.ts`, `usage.ts`, `shop.ts` run and print nothing

They are modules. `npx tsx ch11/usage.ts` exits 0 with no output, and so do
`measure.ts` and `shop.ts` — all three with no key at all. `single.ts` needs a
key to import, and still prints nothing.

## The chapter's four exercises

Each one changes exactly one thing and is read in the same units.

| Exercise | The edit | Where it shows up |
|---|---|---|
| Five runs per topology | Give `TOPOLOGIES` in [`compare.ts`](compare.ts) a fresh `thread` each time, or just run the command five times — each `run-example` is a new process and the `MemorySaver`s start empty. | Whether the gap between two topologies is bigger than the gap between two runs of one. Usually it is not, at n=1. |
| `outputMode: "full_history"` | One word in [`supervisor.ts`](supervisor.ts). | The `input` column. Every internal message of every specialist now lands in the parent transcript and is re-read on every remaining coordinator turn. |
| Drop `subgraphs: true` | Delete one line from the stream options in [`measure.ts`](measure.ts). | Every column falls to whatever reached the parent transcript — under `"last_message"`, a fraction of what the run paid for. The same mistake as summing `result.messages`. |
| Delete a `description` | Remove one `description` from `SPECIALISTS` in [`specialists.ts`](specialists.ts). | Whether the coordinator still routes correctly when one of its four tools describes itself as *"Ask another agent for help."* — the package's fallback string. |

## What is here that the book does not print

**`compare.ts`.** The chapter names the file, gives its command, and describes
its output — three graphs, three calls to `measure` with their own `thread_id`,
three rows of five numbers. It does exactly that and nothing else. The two
things the prose leaves open are settled the obvious way: the rows come out
single-first, because the prose says the single agent is the baseline and both
team rows are read against it; and the thread ids are `cmp-single`,
`cmp-supervisor` and `cmp-swarm`.

**`shop.ts`.** One line. No listing in this chapter imports `"./shop.js"` —
both `specialists.ts` and `single.ts` print `"../shop/tools.js"` — but every
other chapter directory in this repo carries the re-export so that both of the
import forms the fixture documents resolve from anywhere, and this one does
too.

## Where this differs from the page

**`specialists.ts` is printed in two blocks and is one file.** The book heads
them `// ch11/specialists.ts (1 of 2)` and `// ch11/specialists.ts (2 of 2)`;
the file's first line is `// ch11/specialists.ts`, and the two blocks follow in
order with nothing between them. The `(n of 2)` is page furniture.

**`swarm.ts` carries a `@ts-expect-error` the book does not print.** This is
the one place the pinned packages disagree with the page. The chapter says
*"The compiled graph is on `agent.graph`, and that is what both packages want
in their `agents` array"*, and at runtime that is true — the graph built from
`swarm.ts` is the graph `router.ts` builds by hand, node for node. But
`@langchain/langgraph-swarm@1.0.2` types its `agents` array in terms of the
graph `createReactAgent` returns, and `langchain@1.5.4`'s `createAgent` returns
a differently-parameterised one, so `tsc` rejects the assignment:

```text
The types of 'builder._outputDefinition.messages' are incompatible between these types.
```

`@langchain/langgraph-supervisor@1.1.1` widened its own union for exactly this
case — its declaration reads *"Accepts compiled graphs from both
`createReactAgent` (`@langchain/langgraph`) and `createAgent` (`langchain`) via
`.graph`"* — which is why `supervisor.ts` compiles untouched and `swarm.ts`
does not. It is the same "one release behind the surface it is built on"
observation the chapter makes about the supervisor package, landing on the
swarm package instead.

So the printed line stands, byte for byte, with a suppression and an
explanation above it. It is not a fix and it is not silent. When the pin moves
and the types catch up, `tsc` will report the suppression as unused; delete it
then.

**Nothing else.** Every other printed line in this chapter is in this directory
at the path its header claims, in the order it was printed, and the whole
package typechecks:

```bash
npm run typecheck
```
