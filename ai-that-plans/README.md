# Book 4 — AI That Plans

*Stateful AI Agents with LangGraph.js: Memory, Multi-Step Workflows, and Multi-Agent Teams*

Code for **Book 4** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** it plans multi-step work, remembers across sessions, and delegates.

**What this book covers:** persistent state — graphs, typed state channels and reducers, checkpointing, thread- and cross-thread memory, human-in-the-loop interrupts, streaming, time travel, and multi-agent topologies.

## Running the examples

You need Node 24 and, from chapter 6 onward, Docker.

```bash
cp ../.env.example ../.env    # then add your API key
npm ci
npm run run-example -- ch02
```

Chapters 1 through 5 need nothing else — the checkpointer is in memory or in a local SQLite file, on purpose, so that nothing between a node and its state can be the thing that went wrong.

From chapter 6 the checkpointer moves to Postgres:

```bash
npm run db:up                 # or: docker compose up -d
```

That publishes Postgres on **127.0.0.1:5433**, not the default 5432. Book 2's stack already uses 5432, and the books are meant to be runnable independently — so if you still have `ai-that-reads` up, nothing collides.

## The chapters

One directory per chapter, each with its own README that lists every file, what it does, and what it needs. The **default** column is what `npm run run-example -- chNN` runs when you name no listing.

| | Chapter | Default listing | What the directory is | Needs |
|---|---|---|---|---|
| [`ch01`](ch01) | When a while-loop stops being enough | `main` | A plan, a file store and a loop, written by hand and deleted in chapter 2 | key |
| [`ch02`](ch02) | Your first graph | `run` | The same job as two nodes and three edges | key |
| [`ch03`](ch03) | State is the design | `supersteps` | Five channels, four merge behaviours, and the collision a last-value channel throws | — |
| [`ch04`](ch04) | Conditional edges | `run-examples` | The decision as a pure function, and the four ways to wire it: path map, `Command`, `Send`, recursion limit | — |
| [`ch05`](ch05) | Checkpoints | `run` | One six-node job, a `SqliteSaver`, and a switch that kills the process on cue | — |
| [`ch06`](ch06) | Picking a real store | `run-examples` | Memory, SQLite and Postgres behind one factory, plus the ownership table the framework will not create | — / Docker |
| [`ch07`](ch07) | What memory actually means | `run-examples` | The store beside the checkpointer: namespaces, recall, compaction, and both kinds of forgetting | — / key / Docker |
| [`ch08`](ch08) | Human in the loop | `pause` | `interrupt` in front of the money, answered days later by a different process | — |
| [`ch09`](ch09) | Streaming graph state to a UI | `first-stream` | Four stream modes measured, an SSE hub, and thirty lines of browser | — |
| [`ch10`](ch10) | Time travel | `run` | Reading past checkpoints, correcting them, and forking beside them | — |
| [`ch11`](ch11) | Multi-agent: supervisor and handoff | `compare` | One agent, a supervisor and a swarm, and what each one costs | key |
| [`ch12`](ch12) | When multi-agent is a mistake | `split` | The bill for the second agent, and the overlap report that says when not to | — / key |
| [`ch13`](ch13) | Debugging a graph that loops or stalls | `run-examples` | Two deliberately broken graphs, read back out of the checkpointer | — |
| [`ch14`](ch14) | Monday morning | `run-examples` | The whole assistant: plan, delegate, gate, stream, remember | — / key + Docker |

Every listing, and what each one needs, in one command:

```bash
npm run run-example -- --list
```

`--list` reads a table in [`scripts/run.ts`](scripts/run.ts) that names all 173 listings one line at a time. There is no wildcard in it, deliberately: Book 1 used one to keep a directory out of its keyless test suite, the directory was renamed, the wildcard silently stopped matching, and tests that spend money leaked into the suite that was not supposed to spend anything. The same table throws at startup if a file on disk has no line in it.

## What runs without an API key

More of this book than you would expect, because a graph is mostly machinery around the model rather than the model itself. Chapters **3, 5, 8, 9, 10 and 13 run end to end with no key at all**, and so do chapter 4's `run-examples`, chapter 6's `run-examples` and chapter 12's `split`. That is the reducer tests, the routing functions, the checkpoint chain, the pause and its resume, all four stream modes, the whole of time travel, the two deliberately broken graphs, and the build guard in chapter 14 — every one of them printing the same thing on every machine.

```bash
npm test                      # the keyless suite
npm run verify                # typecheck + tests
```

Eight test files, 57 tests, no network and no container:

| File | Asserts |
|---|---|
| `ch03/channels.test.ts` | The four merge behaviours, and that two nodes writing one last-value channel throws |
| `ch04/route.test.ts` | The decision, as a pure function of state |
| `ch08/decide.test.ts` | All three answers, and that the gate survives a JSON round trip |
| `ch08/gate.test.ts` | The edit branch; and that the run stops before the supplier is called |
| `ch10/timetravel.test.ts` | An edit is an append; `asNode` is the program counter; a fork moves the head |
| `ch13/detect.test.ts` | `fingerprint`, `findRepeat`, `pendingPause`, and all three loop causes |
| `ch14/assembly.test.ts` | Three routes, one report against two steps, an idempotent `advance`, a refusal that is an outcome |
| `ch14/no-sampling.test.ts` | No listing in this package sends `temperature`, `top_p` or `top_k` |

Like `scripts/run.ts`, [`vitest.config.ts`](vitest.config.ts) names every test file by exact path and throws if the tree and the list have drifted.

## Starting from here

You do **not** need to have run the previous book's examples. This directory is a self-contained snapshot of the app at this rung: the Braxby Cycles assistant as Book 3 left it, with its tools and sample data, and its state living entirely in memory.

That surface is [`shop/tools.ts`](shop/tools.ts), and it is reachable two ways because the book prints both:

```ts
import { TOOLS, runTool } from "./shop.js";      // chNN/shop.ts re-exports it
import * as shop from "../shop/tools.js";        // the file itself
```

Every chapter directory that prints the first form has a one-line `shop.ts` so it resolves there too.

## Versions

Dependencies here are pinned to exact versions. What is pinned and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.

One pin that is deliberately absent: `better-sqlite3`. The SQLite checkpointer depends on a 12.x range that cannot reach the current 13.x, so pinning it here would install two copies of a native module instead of one. It comes in through the saver.
