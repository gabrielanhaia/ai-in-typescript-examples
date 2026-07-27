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

## What runs without an API key

More of this book than you would expect, because a graph is mostly machinery around the model rather than the model itself. The reducer tests, the routing functions, the checkpoint-history reads, the two deliberately broken graphs in chapter 13, and the build guard in chapter 14 all run with no key and print the same thing on every machine.

```bash
npm test                      # the keyless suite
npm run verify                # typecheck + tests
```

## Starting from here

You do **not** need to have run the previous book's examples. This directory is a self-contained snapshot of the app at this rung: the Braxby Cycles assistant as Book 3 left it, with its tools and sample data, and its state living entirely in memory.

## Versions

Dependencies here are pinned to exact versions. What is pinned and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.

One pin that is deliberately absent: `better-sqlite3`. The SQLite checkpointer depends on a 12.x range that cannot reach the current 13.x, so pinning it here would install two copies of a native module instead of one. It comes in through the saver.
