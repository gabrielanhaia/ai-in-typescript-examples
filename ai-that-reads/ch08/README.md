# Chapter 8 — Search that actually finds it

Two retrievers over one table, fused by position.

| File | What it does |
|---|---|
| [`fts.sql`](fts.sql) | The generated `tsvector` column and its GIN index. |
| [`keyword.ts`](keyword.ts) | `websearch_to_tsquery` + `ts_rank_cd`, over the same table as the dense side. |
| [`hit.ts`](hit.ts) | `Hit`, and `toHit` — where snake-case column names stop. |
| [`dense.ts`](dense.ts) | The chapter 7 query, adapted to hand back the same `Hit`. |
| [`rrf.ts`](rrf.ts) | Reciprocal rank fusion. `1 / (k + index + 1)`, and bookkeeping. |
| [`hybrid.ts`](hybrid.ts) | Both retrievers in one `Promise.all`, fused, sliced. |
| [`filtered.ts`](filtered.ts) | A metadata filter, as a numbered parameter and not a string builder. |
| `filters.sql` | **Not from the book as a file.** The `metadata->>'type'` expression index. |
| `run-examples.ts` | **Not from the book.** The fusion arithmetic, keyless. |

## Run it

The fusion half needs nothing:

```bash
npm run run-example -- ch08
```

The searches need Postgres and an ingested corpus. The keyword side needs **no API key** — it is lexemes, not vectors:

```bash
docker compose up -d
npm run db:setup
npm run run-example -- ch13/sync              # ingest; needs OPENAI_API_KEY
npm run run-example -- ch08/hybrid "BRK-1180"
```

## Expected output

`run-examples.ts` reproduces the chapter's worked arithmetic:

```text
fused, k = 60

  1  0.032018  markdown/workshop-service-bulletins-2026.md
  2  0.016393  markdown/superseded-parts-register.md
  3  0.016129  pdf/catalogue-2026-brakes-spread.pdf
  4  0.015873  pdf/compatibility-2026.pdf
```

`1/61 + 1/64 = 0.032018` against `1/61 = 0.016393`. Twice the score, and it goes to the file that showed up on both lists rather than the file one list put on top.

Then what `k` is for, on a case where changing it changes the winner, what happens when the keyword side returns nothing at all, and why two rows with identical text stay two rows.

Against the ingested corpus, `keywordSearch` returns exactly what the chapter says it does (verified 2026-07-25 at chunk size 900/135):

| Query | Hits | From |
|---|---|---|
| `BRK-1180` | 1 | `markdown/workshop-service-bulletins-2026.md` |
| `EX-24 0001` | 1 | `pdf/safety-recall-2025-11.pdf` |
| `How long do I have to return something I have not used?` | **0** | — |

The last row is what a lexeme index does when the question shares no vocabulary with its answer. The four lexemes `'long' & 'return' & 'someth' & 'use'` all have to appear in one chunk, and the document that answers the question contains "longer" and "length" and nothing the `'english'` configuration stems to `long`. That is the case fusion exists to survive: the keyword list is empty, RRF contributes nothing for it, and you get the dense ranking unharmed.

## Notes

- **`websearch_to_tsquery`, never `to_tsquery`.** The second raises a syntax error on anything that is not an operator expression, so a user typing an apostrophe takes your search endpoint down.
- **`GENERATED ALWAYS ... STORED`** means Postgres maintains the vector inside the same transaction as the write. There is no trigger and no backfill, and no chunk whose text says one thing and whose index says another. Adding the column rewrites the whole table under an exclusive lock — instant here, not instant on a hundred million chunks.
- **`ts_rank_cd` is not BM25.** It never consults the corpus, so a term in every chunk you own counts as much as one in a single chunk. It does not need to be good: the dense side is strong on exactly the queries where ranking has to sort out dozens of matches.
- **`hnsw.ef_search` defaults to 40** on pgvector 0.8.5 (read from `pg_settings`, 2026-07-25), and `hnsw.iterative_scan` and `ivfflat.iterative_scan` both default to `off`. Combine a narrow filter with an approximate index and you get silent under-retrieval. Turn iterative scans on, then confirm you are getting `k` rows back.
- `EnsembleRetriever` in `@langchain/classic@1.0.40` keys documents on `pageContent` and its `c: 0` silently becomes 60, because the constructor does `args.c || 60`.
