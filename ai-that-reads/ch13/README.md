# Chapter 13 — Keeping the index fresh

Work proportional to what actually changed, and a delete path that cannot quietly empty the index.

| File | What it does |
|---|---|
| [`fingerprint.ts`](fingerprint.ts) | `fileHash` — SHA-256 of the bytes, streamed, before anything parses them. |
| [`scan.ts`](scan.ts) | `scanCorpus` over the *named* folders, not the corpus root. |
| [`plan.ts`](plan.ts) | `planRefresh` — a pure function over two lists. Unchanged, changed, gone. |
| [`store.ts`](store.ts) | `indexedSources`, `replaceSource` (upsert then delete then insert, one transaction), `forgetSource`. |
| [`guard.ts`](guard.ts) | `refuseSuspiciousDeletes` — the four statements that stop an unmounted volume emptying your index. |
| [`sync.ts`](sync.ts) | The driver. Also the first-build script. |
| `schema.sql` | **Not from the book as a file.** The `sources` table and the foreign key, verbatim. |
| `run-examples.ts` | **Not from the book.** Scan, plan and guard, keyless. |

## Run it

Keyless:

```bash
npm run run-example -- ch13
```

The real freshness run parses, chunks, embeds and writes, so it needs Postgres and `OPENAI_API_KEY`:

```bash
docker compose up -d
npm run db:setup
npm run run-example -- ch13/sync
npm run run-example -- ch13/sync      # again
```

## Expected output

```text
31 documents, hashed in 0.01s

  d8224dc1c58197c1  markdown/braxby-cycles-overview.md
  …

Walking "corpus" itself instead of the three folders finds 32, not 31:
  README.md
  — a sibling of the corpus, not a member of it

planRefresh against an empty index

  0 unchanged, 31 to re-index, 0 to delete
  31 unchanged, 0 to re-index, 0 to delete   <- a healthy pass
  29 unchanged, 2 to re-index, 1 to delete   <- one edited, one new, one gone

the guard

  one deletion out of 31 is under the threshold — it proceeds
  31 of 31 indexed documents are missing from disk (100%). Refusing to delete them. …
```

`sync.ts` on a fresh database prints a line per document and ends with 31 sources. Run it again immediately and it prints:

```text
31 unchanged, 0 to re-index, 0 to delete
```

and stops. Nothing else proves the hash comparison works for so little effort. If an untouched corpus reports `0 unchanged, 31 to re-index`, the hashes are moving between runs, and the culprit is almost always something non-deterministic in a loader or a normalisation step.

## Notes

- **Freshness is decided per document, never per chunk.** Add a paragraph near the top of a file and every boundary below it moves, so a chunk-level diff reports the entire document as new. Upserts and deletes key on `sourceId`.
- **`sync.ts` uses `chunkPages`, not `chunkDocument`.** Chunking a PDF's pages separately mints the same `chunkId` once per page, which chapter 7's unique expression index rejects on the first multi-page PDF — verified against this corpus: `duplicate key value violates unique constraint "chunks_chunk_id_idx"`, `Key ((metadata ->> 'chunkId'))=(pdf/terms-of-sale-2026.pdf#0) already exists`.
- **The `sources` row has to exist before any chunk that references it.** Skip the ordering and you get, verbatim: `insert or update on table "chunks" violates foreign key constraint "chunks_source_fk"`.
- **The cascade is real.** `forgetSource("html/faq.html")` removes a single `sources` row and its 5 chunks disappear with it. The constraint does that, not a second statement somebody has to remember. Verified 2026-07-25.
- **`chunk_count` should equal `select count(*) from chunks`.** Verified equal (161 = 161) on this corpus at 900/135. If it ever is not, some path is writing chunks without going through `replaceSource`.
- **Twenty per cent is where this repo starts, not where you should stay.** Set it from your own churn. What must not change is that overriding it takes a person: no program can distinguish a deliberate bulk retirement from a share that failed to come up.
- Re-export a PDF and its bytes move even though the page looks identical, so the hash flags it. Chapter 6's cache is what stops that costing anything: keys are built from chunk text, which did not change, so you pay for the parse and for no embeddings at all.
- **`sync.ts` writes `source_id` from `scanCorpus` and the metadata JSON from the loader, and the two disagree** — the column says `markdown/x.md`, the JSON says `corpus/markdown/x.md`. See [`../ch12/README.md`](../ch12/README.md).
