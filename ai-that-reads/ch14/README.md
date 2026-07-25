# Chapter 14 — Ship it Monday

Two lanes over one store. One writes, the other only reads.

| File | What it does |
|---|---|
| [`config.ts`](config.ts) | Every value that belongs to a model or to a corpus, in one place. |
| [`ask.ts`](ask.ts) | The whole application in three calls: retrieve, generate, render. |
| [`config.test.ts`](config.test.ts) | Three configuration checks, one of which asks the database. In `npm run test:live`. |
| [`cli.ts`](cli.ts) | The entry point: a question in, the answer and its footnotes out. |
| [`migrate.ts`](migrate.ts) | Chapter 7's "reversible in an afternoon" claim, as a program. |

## Run it

The answering lane needs all four credentials and an ingested corpus.

```bash
docker compose up -d
npm run db:setup
npm run run-example -- ch13/sync
npm run run-example -- ch14 "How long is the warranty on a Wickhaven frame?"
```

The configuration test needs only Postgres and the schema:

```bash
npm run test:live
```

The migration needs Postgres, Qdrant and `OPENAI_API_KEY` — the key only because `migrate.ts` imports chapter 6's embedder to construct the store, not because it embeds anything:

```bash
npm run run-example -- ch14/migrate
```

## Expected output

`cli.ts` prints the answer, then its footnotes:

```text
Wickhaven frames and rigid forks carry a 60-month warranty [1].

[1]  Warranty policy, Warranty policy › 6. Term by category
     markdown/warranty-policy.md#7
```

`npm run test:live`:

```text
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

The third of those is the useful one. It reads `atttypmod` — the same field a `varchar` uses for its length — and compares the vector column's width against `EMBEDDING_DIMENSIONS`. One round trip, and it turns an unmigrated edit to that constant into a red build the same afternoon.

## Notes

- **`ask.ts` exports a function and has no command line, on purpose.** It is the seam an HTTP handler, a test or a queue worker calls, and none of those want a `process.exit` inside it. `cli.ts` is the entry point, and the chapter prints both.
- **`migrate.ts` prints what it moved.** The row count, the wall clock and `points_count` afterwards, because a migration nobody counted is a migration taken on trust. Run it twice: the second run copies the same rows onto the same derived IDs and the point count does not move.
- **`citable()` is the one place the projection happens.** `Reranked` carries metadata as `Record<string, unknown>` because that is what came out of a `jsonb` column; `Citable` is a `Pick` of four named fields. The casts are unchecked and the file says so. Index documents produced by somebody else's pipeline and this function is where a runtime schema check has to go.
- **`context.map(citable)` preserves order, and that is not cosmetic.** Both `contextBlock` and `renderAnswer` derive a marker from an array position, independently. Reorder the array in between and every footnote in the answer points somewhere else.
- **`SAMPLING` is empty and not by omission.** `claude-sonnet-5` returns a 400 for a non-default `temperature`, `top_p` or `top_k`. The first test in `config.test.ts` is what keeps it empty.
- **`migrate.ts` copies vectors, it does not recompute them.** `addDocuments` would embed whatever you hand it and buy the entire index build a second time to move rows you already own. And treat `ids` as required however it is typed: omitted, `addVectors` generates a random UUID for every point, so re-adding ten rows leaves ten duplicates — no error, recall untouched, MRR down a hundredth, three questions reordered.
- **`CHUNK_SIZE = 900` is the value least likely to suit your corpus.** Nothing in `config.ts` is advice. Three entries are dated facts — the two model identifiers and the dimension count — and the rest are simply what this repository was run with. Chapter 4's sweep is how you arrive at your own.
