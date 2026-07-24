# Book 3 — AI That Acts

*Tool Calling in TypeScript: APIs, Functions, and Your First Working AI Agent*

Code for **Book 3** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** it can act — calling your APIs and functions, not just talking.

**What this book covers:** tool calling and the agent loop — Zod schemas as the contract, the loop written by hand once, then with the framework, MCP, permissions and step limits.

## Status

Not published yet. This directory fills in as the book is drafted — each chapter's example arrives as its own folder with a README stating what it does, the exact command to run it, and the output to expect.

## Running these examples (once published)

```bash
cp ../.env.example ../.env    # then add your API key
docker compose run ai-that-acts ch03  # from the repo root
```

You do **not** need to have run the previous book's examples. This directory is a self-contained snapshot of the app at this rung.

## Versions

Dependencies here are pinned to exact versions. What is pinned and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.
