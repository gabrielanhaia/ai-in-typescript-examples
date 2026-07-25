# Chapter 6 — Calling an embedding model

Batched, bounded, resumable, and cheap to repeat.

| File | What it does |
|---|---|
| [`one-at-a-time.ts`](one-at-a-time.ts) | The obvious loop. Correct, and slower than it has any need to be. |
| [`embedder.ts`](embedder.ts) | The configured client: model, dimensions, `batchSize`, `maxConcurrency`, `maxRetries`. |
| [`embed-batch.ts`](embed-batch.ts) | `embedChunks` and `EmbeddedChunk`, with the timing printed. |
| [`logged.ts`](logged.ts) | The same client with `onFailedAttempt`, so a retry leaves a trace. |
| [`cache.ts`](cache.ts) | `vectorKey` — text plus model plus dimensions — and `VectorCache`. |
| [`build-index.ts`](build-index.ts) | The resumable driver: slice, write, print progress, be killable. |
| [`usage.ts`](usage.ts) | Drops to the provider's client for `total_tokens`, which the binding does not surface. |
| [`custom-embeddings.ts`](custom-embeddings.ts) | The `Embeddings` subclass that is the seam for any other provider. |
| `file-cache.ts` | **Not from the book.** A `VectorCache` on disk, one file per key. |
| `run-examples.ts` | **Not from the book.** Drives the above over the corpus. |

## Run it

Everything except `custom-embeddings.ts` needs `OPENAI_API_KEY` and costs money.

```bash
npm run run-example -- ch06            # the staff handbook, five documents
npm run run-example -- ch06 --all      # the whole corpus
npm run run-example -- ch06 --slow     # plus the one-at-a-time comparison
```

Run it **twice**. The second run is the chapter.

## Expected output

The default is the staff handbook: **5 documents, 31 chunks** at 900/135. `--all` is **31 documents, 161 chunks**. Those two counts are fixed by the corpus and the chunk size, so they are the numbers to check first if yours differ.

The first run prints the slice progress with everything new:

```text
5 documents, 31 chunks

build-index.ts, slice by slice

31/31 (31 new)
```

The second run, over an unchanged corpus, prints `31/31 (0 new)`. A cache that is working says `0 new`; a cache that is not says `31 new` and tells you before the bill does.

Then the batched timing and the three numbers to write down:

```text
embed-batch.ts, one call per batch

31 chunks in …s (… chunks/s)

usage.ts, the numbers to write down

  tokens      …
  vectors     31
  wall clock  …s
```

**This repo prints no timing and no cost of its own**, because they are properties of your machine, your network and the rate on the day. Find the current per-million rate, do the multiplication yourself, and store the rate you used and the day you used it next to the answer.

## Notes

- `file-cache.ts` writes one file per key under `ch06/.vectors/`, not one JSON blob, because a blob rewritten per key does not survive being killed mid-run — which is the property `build-index.ts` exists to provide. Delete the directory to force a cold run.
- The model and the dimension count are in the *key*, not in the directory name. Put them in the name and switching models silently reads the old vectors, with no error at all.
- `build-index.ts` gives up batching across slice boundaries, so `maxConcurrency` has nothing to overlap. That is a deliberate trade: a resumable serial job that prints its progress beats a parallel one that has to start over.
- If you write your own `Embeddings` subclass you inherit `@langchain/core`'s `maxConcurrency` default of `Infinity`, not `OpenAIEmbeddings`' `2`. Route through `this.caller`.
