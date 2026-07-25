# Chapter 7 — Where vectors live

The vectors move into a database. Twice: into Postgres, and into a store built for nothing else.

| File | What it does |
|---|---|
| [`pool.ts`](pool.ts) | The `pg` pool, with `pgvector.registerTypes` in `onConnect` — the option that is awaited. |
| [`sql-store.ts`](sql-store.ts) | `insertChunks` in a transaction, and `nearest`, which never selects the embedding. |
| [`sources.ts`](sources.ts) | `replaceSource`: delete then insert, inside one transaction. |
| [`pgvector-store.ts`](pgvector-store.ts) | The first-party binding. Nine lines instead of sixty. |
| [`qdrant-store.ts`](qdrant-store.ts) | The second path, with the collection's dimension and distance fixed at creation. |
| `schema.sql` | **Not from the book as a file.** The chapter's DDL, verbatim, collected so `npm run db:setup` can apply it. |
| `hnsw.sql` | **Not from the book as a file.** The HNSW index, applied only with `--hnsw`. |
| `operators.ts` | **Not from the book.** Runs the chapter's three verified claims against your own container. |

## Run it

```bash
docker compose up -d
npm run db:setup            # extension, tables, lookup indexes, full-text
npm run run-example -- ch07
```

`operators.ts` needs `DATABASE_URL` and **no API key**: it makes no embedding call at all, and it works on a temporary table it drops at the end.

## Expected output

```text
four operators, two identical unit vectors

  <->  L2 (Euclidean)          0
  <#>  negative inner product  -1   <- the trap
  <=>  cosine distance         0
  <+>  L1 (taxicab)            0

the index is built for L2. Query it with L2:

  Limit
    ->  Index Scan using ch07_demo_l2 on ch07_demo
          Order By: (embedding <-> '[1,0,0]'::vector)

Same table, same index. Query it with cosine:

  Limit
    ->  Sort
          Sort Key: ((embedding <=> '[1,0,0]'::vector))
          ->  Seq Scan on ch07_demo

the 2,000-dimension ceiling

  ERROR:  column cannot have more than 2000 dimensions for hnsw index
```

Three claims, three confirmations. That `-1` is the whole lesson about `<#>`, the `Seq Scan` is what a mismatched operator class costs you with no error anywhere, and the ceiling is why `text-embedding-3-small` at 1,536 is the default and `-large` at 3,072 is not.

Verified against **PostgreSQL 18.4** with **pgvector 0.8.5** and **Qdrant 1.18.3**, the tags in [`../docker-compose.yml`](../docker-compose.yml), on 2026-07-25.

## The vector index is not created by default

`npm run db:setup` creates the table, the two lookup indexes and the full-text column, and **no index on the embedding column**. That is chapter 7's advice, not an omission: an exact sequential scan is exact, needs no build step and no memory budget, and is fast enough for a corpus of a few thousand chunks. Add the index when a measurement says to:

```bash
npm run db:setup -- --hnsw
```

Then run `EXPLAIN` on your own retrieval query and look for the words `Index Scan`. `npm run run-example -- ch07` shows you what both plans look like.

## Notes

- **Register the types in `onConnect`, not `pool.on("connect")`.** Nothing awaits that event, so your registration statement and whatever the caller runs first go out on one connection simultaneously. `pg@8.22.0` prints `DeprecationWarning: Calling client.query() when the client is already executing a query` for the event version and nothing for `onConnect`.
- **The score's polarity differs between the two stores.** pgvector's `similaritySearchWithScore` returns a cosine *distance* (lower is better) and Qdrant returns a *similarity* (higher is better). Both are typed `Promise<[Document, number][]>`. [`../ch14/migrate.ts`](../ch14/migrate.ts) shows the two columns summing to 1.0000 on every row.
- `@langchain/pgvector@0.1.0` is **pre-1.0**. Pinned exactly, and read the changelog before you bump it.
- `PGVectorStore.initialize` creates its table with a `uuid` primary key and **no vector index at all**. The store exposes `createHnswIndex()` for when you are ready.
