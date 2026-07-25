# Chapter 5 — Embeddings without the math

What the numbers are, and the three specific things similarity cannot see.

| File | What it does |
|---|---|
| [`shape.ts`](shape.ts) | Embeds one sentence and prints the length and the first five entries. |
| [`pairs.ts`](pairs.ts) | Scores four pairs: a negation, a changed number, two part numbers, and a question against the table row that answers it. |

## Run it

Both call the embedding model, so both need `OPENAI_API_KEY`. Together they cost a fraction of a cent.

```bash
npm run run-example -- ch05          # pairs.ts
npm run run-example -- ch05/shape
```

## Expected output

`shape.ts`:

```text
1536
[ -0.019…, 0.0043…, -0.0257…, 0.0011…, 0.0138… ]
```

`pairs.ts` prints four scores and two lines of text each. **This repo does not print the scores it got**, for the same reason the book does not: they depend on your model and the day, and a number nobody measured is a number nobody can defend.

Read the rows against each other instead. Rows one to three hold sentence pairs you would never want a retriever to mix up, so a similarity that tracked meaning would put them far apart. Row four holds a customer's question beside the table row that answers it, and the two have almost no vocabulary in common. Whatever order those four scores come out in is the finding.

## Notes

- Both listings import `../ch02/embed.js`, which constructs its client at module load. That is why they need the key before they print anything.
- Swap in your own corpus's traps: the clause somebody rewrote last quarter, the two SKUs one digit apart, the sentence with an exception buried in it. Then keep the file. Nothing else in this repository finds that class of problem for so little effort.
- Switching embedding models invalidates every vector you have stored. `EMBEDDING_MODEL` and `EMBEDDING_DIMENSIONS` live in [`../ch06/embedder.ts`](../ch06/embedder.ts) and in the cache key for that reason.
