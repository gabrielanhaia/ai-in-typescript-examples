# Versions

Every dependency in this repo is pinned to an **exact** version. No `^`, no `~`, no `latest`.

This file is the record of what is pinned, why it is pinned there, and when it was last verified against the real world. It is the reason a reader who picks up a book six months after publication can still run the code.

## The rule

1. **Exact pins only.** A range makes the repo unreproducible and turns a reader's first five minutes into a debugging session.
2. **Every pin has a reason and a date.** "Latest at the time" is a valid reason; an undated pin is not.
3. **Verified twice per book** — once while the book is drafted, once at its fact-check pass — and re-verified whenever CI reports a break.
4. **A pin is only changed deliberately**, with the change noted in the changelog below. Silent bumps are how a repo stops matching the printed book.

## Pinned versions — shared

Both book directories pin these, at the same versions.

| Package | Pinned | Why | Last verified | Used by |
|---|---|---|---|---|
| `langchain` | `1.5.4` | The framework the series teaches. Exports the message classes and `initChatModel`, the provider seam in ch. 14. Moves in lockstep with `@langchain/anthropic` — bump both together or not at all. | 2026-07-25 | `ai-that-answers` |
| `@langchain/anthropic` | `1.5.2` | The provider binding. **1.5.2 specifically**: `1.5.1` depended on `@anthropic-ai/sdk ^0.103.0`, which resolves to a *second, nested* copy of the SDK; `1.5.2` moved to `^0.115.0` and the tree deduplicates to one. Verify with `npm ls @anthropic-ai/sdk` after any bump. | 2026-07-25 | `ai-that-answers` |
| `@langchain/core` | `1.2.3` | Peer of both packages above. The 2026-07-24 release wave raised the floor from `^1.2.1` to `^1.2.3`, so this pin sits **exactly on the floor** — any future bump to `langchain` or `@langchain/anthropic` must re-check this peer before it moves. | 2026-07-25 | `ai-that-answers` |
| `@anthropic-ai/sdk` | `0.115.0` | A top-level dependency from ch. 10 onward, not a chapter-1 cameo. The framework's `getNumTokens` silently returns `Math.ceil(text.length / 4)` for these models, so `client.messages.countTokens` is the only usable counter — and `APIError`/`APIConnectionError` are ch. 12's taxonomy. | 2026-07-25 | `ai-that-answers` |
| `zod` | `4.4.3` | Schema + inferred type in one declaration, ch. 9. v4 is required for `z.toJSONSchema`, which `print-json-schema.ts` uses to show what the provider actually receives. | 2026-07-25 | `ai-that-answers` |
| `hono` | `4.12.32` | The HTTP layer, ch. 8 and ch. 14. Chosen over Express because it was the only candidate actually version-verified for the series, and `hono/streaming`'s `streamSSE` is the whole of the SSE route. | 2026-07-25 | `ai-that-answers` |
| `@hono/node-server` | `2.0.11` | **Hono has no Node listener of its own**, so the ch. 8 server cannot run without this. Peer is `hono ^4`; pin the two together, always. Found by starting the server, not by reading docs. | 2026-07-25 | `ai-that-answers` |
| `typescript` | `7.0.2` | Current stable (released 2026-07-08). Documented fallback **5.9.3**, with **6.0.3** as the intermediate option — 6.0 carries its own breaking changes (import assertions deprecated, generic JSX inference), so falling back into 6.x trades one migration for another. | 2026-07-25 | `ai-that-answers` |
| `@types/node` | `24.13.3` | **Never `latest`.** `latest` is `26.x` — Node 26 typings — which contradicts the Node 24 LTS runtime pin below and produces type errors that look like code bugs. | 2026-07-25 | `ai-that-answers` |
| `tsx` | `4.23.1` | Runs the `.ts` listings directly, so no build step stands between a reader and an example. Loaded with `node --import tsx`. | 2026-07-25 | `ai-that-answers` |
| `vitest` | `4.1.10` | The unit tests. `npm run verify` runs them and they never touch the network; the one test that calls the model is in `npm run test:live`. | 2026-07-25 | `ai-that-answers`, `ai-that-reads` |

Where the "Used by" column above says only `ai-that-answers`, Book 2 either does not use the package (`hono`, `@hono/node-server`) or pins the identical version for the same reason (`langchain`, `@langchain/anthropic`, `@langchain/core`, `@anthropic-ai/sdk`, `zod`, `typescript`, `@types/node`, `tsx`).

`@anthropic-ai/sdk` is worth one extra sentence in Book 2: it arrives from Book 1, but chapter 10's `budget.ts` imports it directly for `messages.countTokens`, so it has to be a top-level dependency here too, at the same `0.115.0` that `@langchain/anthropic@1.5.2` resolves to. **Chapter 10 names it in an install line** for exactly that reason — it used to be the one import in Book 2 with no install line anywhere behind it. `npm ls @anthropic-ai/sdk` shows one copy, deduped.

## Pinned versions — Book 2, *AI That Reads*

Retrieval adds a second provider, a third for reranking, two containers, and the parsers. Everything below was installed and run on 2026-07-25.

| Package | Pinned | Why | Last verified | Chapter |
|---|---|---|---|---|
| `@langchain/openai` | `1.5.5` | The embedding binding. **A second vendor is unavoidable**: Anthropic sells no embeddings endpoint and points at Voyage AI instead, so there is no version of this app that runs on one key. `batchSize` defaults to 512 and `maxConcurrency` to 2 — both read out of the shipped source, neither documented. | 2026-07-25 | 2, 6 |
| `openai` | `6.49.0` | The provider's own client, used **only for measurement**. `embedDocuments` returns vectors and nothing else, so `response.usage.total_tokens` is unreachable through the binding. Same move Book 1 made for token counting. | 2026-07-25 | 6 |
| `pdf-parse` | `2.4.5` | PDF text extraction, called directly rather than through a loader wrapper. **2.x is a class, where older tutorials show a function**: construct with the bytes, `getText()`, `destroy()` in a `finally`. `pageJoiner` defaults to `-- n of m --`, which lands inside the string you are about to embed. | 2026-07-25 | 3 |
| `cheerio` | `1.2.0` | HTML parsing. `.text()` concatenates descendants with no separator, so a table becomes word salad — the loader inserts the separators back before asking for the text. Latest at pin time; see the deprecation note below. | 2026-07-25 | 3 |
| `@langchain/textsplitters` | `1.0.1` | The recursive and Markdown splitters. Default separator list is `["\n\n", "\n", " ", ""]` — no sentence boundary, and the Markdown list has **no `"\n# "`** in it, so top-level headings are not split points. | 2026-07-25 | 4 |
| `pg` | `8.22.0` | The PostgreSQL driver. Has an **`onConnect` option that is awaited**, unlike the `connect` event every example on the internet shows; the event version races the caller's first query and prints a deprecation warning. | 2026-07-25 | 7, 8, 11, 13 |
| `pgvector` | `0.3.0` | Not the extension — the npm glue that turns a JS array into the text form the extension parses, and back. Use **`registerTypes`**, plural; the singular `registerType` still exists and is deprecated, which you find by reading the source and not from a type error. | 2026-07-25 | 7, 8, 13 |
| `@types/pg` | `8.20.0` | `pg` ships no type declarations, so without this every return value from the driver is `any`. | 2026-07-25 | 7 |
| `@langchain/pgvector` | `0.1.0` | The first-party store binding. **Pre-1.0**: first-party and current and not deprecated, and also a `0.x`, so pin it exactly and read the changelog before bumping. Its `initialize` creates a table with **no vector index at all**, and its `similaritySearchWithScore` returns a *distance*. | 2026-07-25 | 7 |
| `@langchain/qdrant` | `1.0.3` | The second store path. `QdrantVectorStore` is exported from the package root. Returns a *similarity* where pgvector returns a *distance*, with identical type signatures. | 2026-07-25 | 7, 14 |
| `@qdrant/js-client-rest` | `1.18.0` | Peer of the binding above. Matches the `qdrant/qdrant:v1.18.3` image. | 2026-07-25 | 7, 14 |
| `@langchain/cohere` | `1.1.0` | The reranker. **Do not pin `cohere-ai` alongside it** — the binding brings its own copy and a top-level pin resolves a second one. `CohereRerank`'s doc comment claims a default model; the shipped code has none and throws `Model not specified for CohereRerank instance`. `topN` defaults to 3. | 2026-07-25 | 9 |
| `@langchain/classic` | `1.0.40` | Holds `EnsembleRetriever` and `ContextualCompressionRetriever`, which **used to arrive as somebody else's transitive dependency** and now have to be asked for by name. `EnsembleRetriever` keys documents on `pageContent` and its `c: 0` silently becomes 60. | 2026-07-25 | 8, 9 |

### Containers

| Image | Pinned | Why | Last verified |
|---|---|---|---|
| `pgvector/pgvector` | `0.8.5-pg18` | **One tag names both versions**, so the extension and the database move together or not at all. Resolves to PostgreSQL 18.4 (verified by running it). Mount the volume at `/var/lib/postgresql`, **not** `.../data`: the PG18 images moved the data directory under a versioned subdirectory, and the old path makes `initdb` refuse to start. | 2026-07-25 |
| `qdrant/qdrant` | `v1.18.3` | Apache-2.0, starts with no account, no key and no licence file, which is why it is the dedicated store this series teaches. Bound to localhost with no authentication — fine for learning, not how you would expose it. | 2026-07-25 |

Runtime settings read from `pg_settings` on that container, 2026-07-25, because chapter 8 depends on all four: `hnsw.ef_search` **40**, `hnsw.iterative_scan` **off**, `hnsw.max_scan_tuples` **20000**, `ivfflat.iterative_scan` **off**.

### Models

| | Pinned | Why | Last verified |
|---|---|---|---|
| Answering | `claude-sonnet-5` | Handed over by Book 1's chapter 14. This book puts thousands of tokens of retrieved material into every prompt and asks for careful, faithful reading of it, which is the workload the mid tier exists for. **Rejects a non-default `temperature`, `top_p` or `top_k` with a 400.** Minimum cacheable prefix 1,024 tokens. | 2026-07-25 |
| Embedding | `text-embedding-3-small` | 1,536 dimensions, reducible via the `dimensions` parameter, 8,192-token input limit. 1,536 sits inside pgvector's 2,000-dimension index ceiling; `text-embedding-3-large` at 3,072 does not. **`model` defaults to `text-embedding-ada-002`**, which does not support `dimensions` at all, so leaving it out gets you something else. | 2026-07-25 |
| Reranking | `rerank-v4.0-fast` | 32,768-token context. `rerank-v4.0-pro` is the quality ceiling and `rerank-v3.5` is still current with a 4,096-token limit that is the thing to watch. Pass the model explicitly; there is no default. | 2026-07-25 |

### The wrapper package that is gone

**`@langchain/community` was deprecated wholesale on 2026-05-27**, and with it a dozen tutorials' worth of import paths: the PDF and HTML document loaders, the Transformers.js embeddings binding, and a long tail of store and retriever wrappers. It is not coming back and it is not in this repository.

What replaced each thing Book 2 would have used it for:

| Was | Is now | Where |
|---|---|---|
| `PDFLoader` | `pdf-parse` **2.4.5**, called directly | `ch03/load-pdf.ts` |
| `CheerioWebBaseLoader` | `cheerio` **1.2.0**, called directly | `ch03/load-html.ts` |
| `PGVectorStore` from community | `@langchain/pgvector` **0.1.0** | `ch07/pgvector-store.ts` |
| A BM25 / in-memory keyword retriever | **PostgreSQL full-text search** — `to_tsvector`, `websearch_to_tsquery`, `ts_rank_cd`, GIN | `ch08/fts.sql`, `ch08/keyword.ts` |
| `HuggingFaceTransformersEmbeddings` | no first-party binding; the `Embeddings` subclass around Transformers.js | `ch06/custom-embeddings.ts` |

Two of those are upgrades rather than substitutions. Calling the parsers directly is what exposes the parameter that fixes a two-column page and the intermediate value that says a page had no text on it — both of which a wrapper removes. And Postgres full-text search costs **no new dependency, no second index to keep in sync, and no in-memory structure that forgets everything on restart**; one `DELETE` removes a document from both halves of the search, because there is only one row.

There is a lesson in how the deprecation was found, and chapter 3 states it: asking npm for the package's version returned an ordinary version number with no complaint. The deprecation was visible only in the manifest's `deprecated` field and in the warning a real install printed. **A version number is not a verification.**

### Known transitive deprecation

`npm ci` in `ai-that-reads` prints exactly one deprecation warning, and it is not ours to fix:

```text
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead …
```

The chain is `cheerio@1.2.0` → `encoding-sniffer@0.2.1` → `whatwg-encoding@3.1.1`. `cheerio@1.2.0` **is** the latest release and it still declares `encoding-sniffer: ^0.2.1`; `encoding-sniffer@1.0.2` is the version that swapped to `@exodus/bytes`, and forcing it through an `overrides` entry would violate cheerio's own declared range on an unverified major bump — in a loader whose failures arrive as text rather than as errors. Left alone, deliberately, and recorded here with a date instead. Re-check when cheerio next moves.

No package pinned in this repository is deprecated, and `npm ls` shows no second copy of anything either directory pins.

## Runtime

| Component | Pinned | Why | Last verified |
|---|---|---|---|
| Node.js | **24.18.0** ("Krypton", Active LTS) | Recorded in [`.nvmrc`](../.nvmrc) at the repo root, which is what CI reads (`node-version-file: .nvmrc`) and what `nvm use` picks up. Matches the `@types/node` pin. | 2026-07-25 |
| Base image | `node:24-bookworm-slim` | The 24.x line, Debian bookworm, slim. Used by every book directory that ships a `Dockerfile`; the exact patch a build resolves to is whatever the tag points at on build day. `ai-that-reads` has none — its containers are the two stores, and its examples run on your own Node. | 2026-07-25 |
| TypeScript config | `strict`, `module: nodenext`, **`skipLibCheck: true`** | `skipLibCheck` is **required, not a preference**: without it `tsc` fails inside `@langchain/anthropic@1.5.2`'s own `webSearch.d.ts`, which references `BetaWebSearchTool20250305` — a type `@anthropic-ai/sdk@0.115.0` renamed to `BetaWebSearchTool20260209`. Library-internal, reproducible, no runtime effect. | 2026-07-25 |

## Model — Book 1

Book 2's three models are in its own table above.

| | Pinned | Why | Last verified |
|---|---|---|---|
| Example model | `claude-haiku-4-5` | Book 1's subject *is* cost and a beginner runs a script dozens of times, so the cheapest tier is the honest default. It is also the only tier that accepts `temperature`/`top_p`/`top_k`, which is what makes chapter 5 teachable at all. From Book 2 the running app moves to `claude-sonnet-5`. | 2026-07-25 |
| Rates used in the code | `ch11/rates.ts` | The rate table carries its own `VERIFIED_ON` constant, so a cost printed by this repo always names the date its constants were checked. Chapter 14's log line prints that date beside every figure. | 2026-07-25 |

## Scheduled verification

`.github/workflows/verify.yml` runs on a schedule and on demand. For every book directory that has a `package.json`, it:

- installs and runs the examples **against the pinned versions** — this must always pass, and a failure means the repo is broken for readers today;
- installs and runs them **against latest** — this is allowed to fail, and when it does the workflow opens an issue naming the package and the error.

Both jobs run `npm run typecheck` and `npm run verify`. **Neither uses an API key**, by design: a scheduled job that spends money is a job someone eventually turns off. What CI can catch without a key is every kind of breakage a version bump causes — a renamed export, a changed type, a moved entry point. What it cannot catch is the provider changing its mind about a parameter; that is chapter 5's live probe, `npm run test:live`, and it is run deliberately.

That second job is the early-warning system for framework churn. When it fires: fix the repo immediately, record the new pin here with today's date, and note it for the book's next edition.

## Changelog

Changes to a pin go here, newest first — date, what moved, from what to what, and why.

- **2026-07-25 — Book 2's set, *AI That Reads*.** Thirteen new packages and two container images, all verified by installing the tree, starting both containers, and running `npm ci && npm run typecheck && npm run verify` plus every chapter that does not need a key. Four of them were arrived at the hard way. `@langchain/community` is **absent, not forgotten** — it was deprecated wholesale on 2026-05-27 and every loader Book 2 would have taken from it is now the underlying library called directly. `cohere-ai` is **deliberately not pinned**, because `@langchain/cohere` brings its own copy and a top-level pin resolves a second one. `@langchain/pgvector` is a `0.1.0` and that is stated rather than glossed. And `@anthropic-ai/sdk` is a top-level dependency here too, at the same `0.115.0`, because chapter 10's `budget.ts` imports it directly — which is why chapter 10 now carries the install line for it. One transitive deprecation warning survives, through `cheerio@1.2.0`, and is recorded above rather than papered over with an `overrides` entry.
- **2026-07-25 — first published set.** Every pin above landed with *AI That Answers*, verified by installing the tree and running `npm ci && npm run typecheck && npm run verify` on it. Two of them were arrived at the hard way and are worth restating: `@langchain/anthropic` is `1.5.2` rather than `1.5.1` because `1.5.1` produces a duplicated `@anthropic-ai/sdk`, and `@types/node` is `24.13.3` rather than `latest` because `latest` is Node 26 typings against a Node 24 runtime.
