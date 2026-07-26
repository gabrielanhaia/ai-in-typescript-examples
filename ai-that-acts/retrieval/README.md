# retrieval — Book 2's pipeline, as a fixture

**Not a listing from the book.** Chapter 12 imports `retrieve` from here and
wraps it in a schema and a description; nothing in that chapter touches this
directory.

This is the **reduced** version, on purpose. Book 2's own pipeline is a dense
search and a keyword search fused by rank, a cross-encoder over fifty
candidates, and a Postgres database behind both. Reproducing that here would
put a container, an embeddings vendor and a reranking vendor between a reader
of *this* book and their first tool call.

So what ships is the same interface over a small pre-built index:

```ts
retrieve(query: string, k: number): Promise<Reranked[]>
citable(hit: Reranked): Citable
locationOf(meta: Citable): string
```

If you finished Book 2, point chapter 12's import at your own retriever and
delete this directory. The signature is the one you already have.

## What is in it

| File | What it is |
|---|---|
| `retrieve.ts` | Okapi BM25 over the committed index. No network, no key, no container. |
| `index.json` | 50 chunks, committed, so nobody has to build anything. |
| `build-index.ts` | Rebuilds it: `npm run retrieval:build`. |
| `corpus/` | Seven Braxby documents, copied from `ai-that-reads/corpus/markdown`. |

One chunk per `##` section, which is Book 2's by-heading splitter with the
numbers taken off the section names — the label a citation carries has to be a
place a reader can find, and "5. Crash replacement" is a table of contents
entry rather than a place.

## Why lexical only

Book 2 gets hyphen and morphology handling from the dense half of its hybrid
search. The fixture has to do it in the tokeniser, so a hyphenated word is
indexed whole and in halves and a query saying "workshop built" reaches a
policy saying "workshop-built".

What it keeps is the property chapter 12's examples turn on: a bare part
number is found. `rear adapter 180 mm Halvard R4` returns the 2026-04 bulletin
at a score five times the next candidate, and that bulletin is the only place
`BRK-1180` appears.

What it loses is Book 2's recall on paraphrase. That is a fixture's honest
limit and not a claim about retrieval.

## The corpus

Seven Markdown documents, unmodified from Book 2: the warranty policy, the
returns policy, the workshop service terms, the 2026 workshop bulletins, the
service intervals, the order lifecycle and the shipping terms. Braxby Cycles
is fictional and so is every document in it.
