# Book 1 — AI That Answers

*Your First LLM App in TypeScript: Prompts, Structured Output, and What Every Token Costs*

Code for **Book 1** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** a chatbot that works, streams, returns typed structured output, and whose cost you can predict.

**What this book covers:** the single LLM call — prompts, streaming, structured output with Zod, errors and retries, tokens and cost.

## Status

Not published yet. This directory fills in as the book is drafted — each chapter's example arrives as its own folder with a README stating what it does, the exact command to run it, and the output to expect.

## Running these examples (once published)

```bash
cp ../.env.example ../.env    # then add your API key
docker compose run ai-that-answers ch03  # from the repo root
```

You do **not** need to have run the previous book's examples. This directory is a self-contained snapshot of the app at this rung.

## Versions

Dependencies here are pinned to exact versions. What is pinned and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.
