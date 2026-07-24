# Book 2 — AI That Reads

*RAG in TypeScript: Embeddings, Vector Search, and Answers Grounded in Your Documents*

Code for **Book 2** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** the chatbot now answers from your own documents, with citations.

**What this book covers:** retrieval — loading and parsing sources, chunking, embeddings, vector search, reranking, citations.

## Status

Not published yet. This directory fills in as the book is drafted — each chapter's example arrives as its own folder with a README stating what it does, the exact command to run it, and the output to expect.

## Running these examples (once published)

```bash
cp ../.env.example ../.env    # then add your API key
docker compose run ai-that-reads ch03  # from the repo root
```

You do **not** need to have run the previous book's examples. This directory is a self-contained snapshot of the app at this rung.

## Versions

Dependencies here are pinned to exact versions. What is pinned and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.
