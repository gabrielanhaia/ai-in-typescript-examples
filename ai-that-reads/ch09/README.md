# Chapter 9 — Reranking

Retrieve wide, rank hard, prompt narrow.

| File | What it does |
|---|---|
| [`rerank.ts`](rerank.ts) | `CohereRerank` with `model` passed explicitly, because the shipped code has no default. |
| [`retrieve.ts`](retrieve.ts) | Fifty candidates from hybrid search, scored by a cross-encoder, down to `k`. |
| [`framework.ts`](framework.ts) | The composable form: `ContextualCompressionRetriever` around the same reranker. |
| [`diversity.ts`](diversity.ts) | `capPerSource` — five lines, no model call, for the redundancy reranking creates. |
| `run-examples.ts` | **Not from the book.** The diversity half, keyless. |

## Run it

Keyless:

```bash
npm run run-example -- ch09
```

The reranker needs `COHERE_API_KEY`, plus Postgres and `OPENAI_API_KEY` for the hybrid stage underneath it:

```bash
npm run run-example -- ch09/retrieve "when does the returns window start"
```

## Expected output

`run-examples.ts` takes a candidate list in which one document contributed three adjacent chunks about the same clause — the usual shape of the redundancy — and shows what the cap spends those slots on instead:

```text
what the reranker returned, top 5

  1  0.94  markdown/staff-handbook/04-returns-desk.md      runs from the delivery date the carrier recorded
  2  0.91  markdown/staff-handbook/04-returns-desk.md      thirty days to send something back
  3  0.88  markdown/staff-handbook/04-returns-desk.md      the desk checks the packaging first
  4  0.86  pdf/terms-of-sale-2026.pdf                      clause 5.2: the carrier record is determinative
  5  0.84  html/faq.html                                   30 days from the day your order arrives

capPerSource(hits, 2), then top 5

  1  0.94  markdown/staff-handbook/04-returns-desk.md      runs from the delivery date the carrier recorded
  2  0.91  markdown/staff-handbook/04-returns-desk.md      thirty days to send something back
  3  0.86  pdf/terms-of-sale-2026.pdf                      clause 5.2: the carrier record is determinative
  4  0.84  html/faq.html                                   30 days from the day your order arrives
  5  0.79  markdown/returns-and-refunds.md                 an unused item within 30 days of delivery
```

The relevance scores in that list are illustrative, not measured. What is measured is what `retrieve` returns on your own corpus, and the chapter tells you what to look at: the returns desk procedure and clause 5.2 above the FAQ. If they are further down, nothing here can help: the reranker only reorders what arrived. Widen the candidate list first, which is chapter 8's territory.

## Notes

- **Name the model in the constructor.** The TSDoc on the option advertises `rerank-english-v2.0` as a fallback. Open the compiled file at `@langchain/cohere@1.1.0` and there is no fallback there at all — omit it and you get `Model not specified for CohereRerank instance` on construction.
- **Do not pin the Cohere API client alongside the binding.** `@langchain/cohere` brings its own copy, and a top-level pin resolves a second one. `package.json` therefore lists `@langchain/cohere` and not `cohere-ai`; `npm ls cohere-ai` shows one copy.
- **`rerank` returns positions, `compressDocuments` returns documents — and mutates yours.** `compressDocuments` writes `relevanceScore` into the metadata of the objects you passed in. `retrieve.ts` uses `rerank` so your own `Hit` objects are never handed to the vendor and never come back rebuilt.
- `topN` defaults to **3** in this binding, applied even when you called it hoping for a full reordering.
- The early return on an empty candidate list is not decoration: sending zero documents to a rerank endpoint costs money and returns nothing, and on the five unanswerable questions that branch is the one that runs.
