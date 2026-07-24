# Book 4 — AI That Plans

*Stateful AI Agents with LangGraph.js: Memory, Multi-Step Workflows, and Multi-Agent Teams*

Code for **Book 4** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** it plans multi-step work, remembers across sessions, and delegates.

**What this book covers:** persistent state — graphs, checkpointing, memory, human-in-the-loop interrupts, multi-agent patterns.

## Status

Not published yet. This directory fills in as the book is drafted — each chapter's example arrives as its own folder with a README stating what it does, the exact command to run it, and the output to expect.

## Running these examples (once published)

```bash
cp ../.env.example ../.env    # then add your API key
docker compose run ai-that-plans ch03  # from the repo root
```

You do **not** need to have run the previous book's examples. This directory is a self-contained snapshot of the app at this rung.

## Versions

Dependencies here are pinned to exact versions. What is pinned and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.
