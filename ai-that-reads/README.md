# Book 2 — AI That Reads

*RAG in TypeScript: Embeddings, Vector Search, and Answers Grounded in Your Documents*

Code for **Book 2** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** the chatbot now answers from your own documents, with citations.

**What this book covers:** retrieval — loading and parsing sources, chunking, embeddings, vector search, reranking, citations.

## Status

Not published yet. This directory fills in as the book is drafted — each chapter's example arrives as its own folder with a README stating what it does, the exact command to run it, and the output to expect.

## The sample corpus

[`corpus/`](corpus) holds the document set every measurement in this book is taken over: 31 mixed-format documents — Markdown, HTML and PDF — belonging to **Braxby Cycles**, the fictional bicycle-parts retailer the running example has served since Book 1.

It is committed and stable, so a number you measure is a number you can compare. It is also deliberately imperfect: a two-column PDF page that linearises into nonsense, a table that loses its columns, a page with no text layer at all, the same policy stated four different ways, a product code that semantic search alone will not find, and five questions whose answers are genuinely not in the corpus. Every planted trap is documented in [`corpus/README.md`](corpus/README.md) with the chapter that uses it.

[`corpus/questions.jsonl`](corpus/questions.jsonl) carries the 30 evaluation questions with known answers, plus 5 with a `null` answer. Chapter 12 measures recall@k and MRR against exactly that file.

Everything in `corpus/` is original work, MIT-licensed with the rest of the repo. Braxby Cycles is fictional; any resemblance to a real business is coincidence.

## Running these examples (once published)

```bash
cp ../.env.example ../.env    # then add your API key
docker compose run ai-that-reads ch03  # from the repo root
```

You do **not** need to have run the previous book's examples. This directory is a self-contained snapshot of the app at this rung.

## Versions

Dependencies here are pinned to exact versions. What is pinned and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.
