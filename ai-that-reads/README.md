# Book 2 — AI That Reads

*RAG in TypeScript — the retrieval half of the series.*

Code for **Book 2** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** the chatbot now answers from your own documents, with citations.

Every code listing printed in the book exists in this directory and runs. Each chapter has its own folder with a README stating what each listing does, the exact command, and the output to expect. The paths are the ones the book prints — `ch07/pool.ts` is `ch07/pool.ts` — because the book prints imports like `from "../ch07/pool.js"` and those have to resolve.

## Run an example

From **this directory**:

```bash
nvm use                   # Node 24.18.0, from ../.nvmrc
npm ci
npm run run-example -- ch03
```

More shapes of the same command:

```bash
npm run run-example -- --list                    # every listing, and what each needs
npm run run-example -- ch08/hybrid "BRK-1180"    # a named listing, with arguments
npm run run-example -- ch01/grounded corpus/markdown/warranty-policy.md
```

`npm run run-example` reads `../.env` and `.env` if either exists, and is the one place credentials are checked — the listings themselves are exactly as printed in the book.

## What you need, and when

**Nothing at all** for chapters 3 and 4, and for the keyless half of 2, 8, 9, 10, 11, 12 and 13. Those are the ones to run first.

**A container** from chapter 7 onward:

```bash
cp .env.example .env      # then fill it in
docker compose up -d      # Postgres with pgvector, and Qdrant
npm run db:setup          # extension, tables, lookup indexes, full-text column
```

`db:setup` deliberately creates **no index on the embedding column**, because chapter 7's advice is to start exact and add one when a measurement says to. When you are ready: `npm run db:setup -- --hnsw`.

**Three keys**, because a retrieval app is three vendors and that is a fact about the market rather than a design choice:

| Variable | Who wants it | Chapters |
|---|---|---|
| `ANTHROPIC_API_KEY` | the answering model | 1, 2, 10, 14 |
| `OPENAI_API_KEY` | the embedding model | 2, 4, 5, 6, 7, 8, 12, 13, 14 |
| `COHERE_API_KEY` | the reranker | 9, 10, 12, 14 |

There is no version of this application that runs on one key: the vendor behind `claude-sonnet-5` does not sell an embeddings endpoint. Chapter 5 makes that fact do some teaching.

To have anything to search, ingest the corpus once — this is the step that costs money:

```bash
npm run run-example -- ch13/sync
```

Chapter 13's refresh script is also the first-build script: run it against an empty index and every document hashes as changed.

## Chapters

| | Directory | What it covers |
|---|---|---|
| 1 | [`ch01`](ch01) | The answer with no document behind it, and the same answer with one |
| 2 | [`ch02`](ch02) | Retrieval by hand: embed, cosine, rank, answer |
| 3 | [`ch03`](ch03) | Markdown, HTML and PDF, and what each one loses |
| 4 | [`ch04`](ch04) | Where to cut, measured rather than copied |
| 5 | [`ch05`](ch05) | What similarity cannot see |
| 6 | [`ch06`](ch06) | Batched, bounded, resumable, cached |
| 7 | [`ch07`](ch07) | pgvector and Qdrant, and whether your index is being used |
| 8 | [`ch08`](ch08) | Full-text search beside the vectors, fused by position |
| 9 | [`ch09`](ch09) | Retrieve wide, rank hard, prompt narrow |
| 10 | [`ch10`](ch10) | Four regions, and the contract that permits "I don't know" |
| 11 | [`ch11`](ch11) | One identity from the file to the footnote |
| 12 | [`ch12`](ch12) | recall@k, MRR, and the one question that decides what to fix |
| 13 | [`ch13`](ch13) | Hash, upsert, delete, and the guard that refuses a mass delete |
| 14 | [`ch14`](ch14) | Two lanes over one store |

## The sample corpus

[`corpus/`](corpus) holds the document set every measurement in this book is taken over: 31 mixed-format documents — Markdown, HTML and PDF — belonging to **Braxby Cycles**, the fictional bicycle-parts retailer the running example has served since Book 1.

It is committed and stable, so a number you measure is a number you can compare. It is also deliberately imperfect: a two-column PDF page that linearises into nonsense, a table that loses its columns, a page with no text layer at all, the same policy stated four different ways, a product code that semantic search alone will not find, and five questions whose answers are genuinely not in the corpus. Every planted trap is documented in [`corpus/README.md`](corpus/README.md) with the chapter that uses it.

[`corpus/questions.jsonl`](corpus/questions.jsonl) carries 35 evaluation questions: 30 with known answers, 5 with a `null` answer, and 2 of the 30 answerable only from a scanned page. Chapter 12 measures recall@k and MRR against exactly that file.

Everything in `corpus/` is original work, MIT-licensed with the rest of the repo. Braxby Cycles is fictional; any resemblance to a real business is coincidence.

## Verify it

```bash
npm ci
npm run typecheck     # tsc --noEmit, zero errors
npm run verify        # typecheck + the unit tests
```

**`npm run verify` never calls a provider, never touches a container, and never needs a key.** It collects exactly two test files and six tests: `ch11/render.test.ts` and `ch12/score.test.ts`. If that count moves without a listing being added, something has leaked.

The one test that needs infrastructure — chapter 14's check that the `embedding` column is as wide as `EMBEDDING_DIMENSIONS` — lives in `npm run test:live` and is run deliberately, after `docker compose up -d && npm run db:setup`. It spends no tokens.

## What it costs to run

The answering model is **`claude-sonnet-5`**, inherited from the end of Book 1. Every request here carries a few thousand tokens of retrieved passages and asks the model to read them faithfully, which is what the mid tier is for. The embedding model is **`text-embedding-3-small`** and the reranker is **`rerank-v4.0-fast`**.

Two bills, and they behave differently. **Indexing is a one-off over the corpus** — 31 documents, 161 chunks at the chunk size in `ch14/config.ts` — and for a corpus of documents rather than logs it is usually an anticlimax. While you are still choosing numbers it is not one-off at all: change the chunk size or the embedding model and you pay for the whole pass over again. **Generation is recurring, per question**, and a retrieval prompt is mostly input.

**No dollar total is printed here**, because it would be a figure nobody measured on your account. What the repo gives you instead is the arithmetic: `npm run run-example -- ch06` prints tokens, vectors and wall clock for a real pass, and chapter 6 tells you to write the rate and the date down beside them.

The two to run before anything that loops: `npm run run-example -- ch12`, which is free and gives you a retrieval baseline, and `npm run run-example -- ch06` on one folder, which is a fraction of a cent.

## Versions

Everything is pinned to an exact version. What is pinned, why, and when it was last verified: [`../docs/versions.md`](../docs/versions.md). If something breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.

Three pins are load-bearing enough to repeat here:

- **`skipLibCheck: true`** is required. Without it `tsc` fails inside `@langchain/anthropic@1.5.2`'s own `webSearch.d.ts`, which references a type `@anthropic-ai/sdk@0.115.0` renamed. Library-internal, no runtime effect.
- **`@types/node` is pinned to 24.13.3**, not `latest`, which is Node 26 typings against a Node 24 LTS runtime.
- **`cohere-ai` is not a dependency.** `@langchain/cohere` brings its own copy, and a top-level pin resolves a second one.

You do **not** need to have run Book 1's examples. Each book's directory is a self-contained snapshot of the app at that rung.

## Where this repo differs from the printed page

Small, deliberate, and listed here so nothing is a surprise.

- **One manifest, not one per chapter**, with the same exact pins. Where a chapter says `npm install pdf-parse@2.4.5 cheerio@1.2.0`, they are already in `package.json`.
- **Directories are named after the chapter**, exactly as the book prints them, so `../ch07/pool.js` resolves.
- **`@anthropic-ai/sdk` is a top-level dependency.** Chapter 10's `budget.ts` imports it directly for `messages.countTokens`; no chapter lists it in an install line, because it arrives from Book 1.
- **The DDL is collected into files.** Chapters 7, 8 and 13 print their SQL in prose, one statement at a time. `ch07/schema.sql`, `ch07/hnsw.sql`, `ch08/filters.sql` and `ch13/schema.sql` hold those statements verbatim so `npm run db:setup` can apply them in the one order that works.
- **Eleven files are not listings from the book.** Every one says so on its first line, and its chapter's README says so too: the eight `chNN/run-examples.ts` drivers, so that chapters made entirely of exports have something to run; `ch06/file-cache.ts`, the `VectorCache` the book defines and never implements; `ch07/operators.ts`, which runs chapter 7's three verified claims against your own container; and `ch14/cli.ts`, the command line the printed `ask.ts` does not have.
- **Two fixture directories.** `ch02/fixtures/shelf.json` is hand-written eight-dimension vectors, not embeddings, so the cosine function and the linear scan run with no key. `ch03/fixtures/fragment.html` is chapter 3's HTML fragment wrapped in a complete page.
- **`sourceId` is spelled two ways.** Chapter 3's loaders store the path they were handed (`corpus/markdown/x.md`); chapter 13's `scanCorpus` stores the corpus-relative path (`markdown/x.md`), which is what `corpus/questions.jsonl` uses. The `source_id` *column* gets the corpus-relative one, so chapter 12's harness is unaffected; the metadata JSON gets the other, which is why chapter 11's `scoreCitations` needs the prefix stripped. See [`ch12/README.md`](ch12/README.md).
