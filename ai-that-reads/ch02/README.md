# Chapter 2 — Retrieval in thirty lines

The whole loop by hand: three text files, one embedding call, an array in memory, cosine written out with the square roots visible, one grounded answer.

| File | What it does |
|---|---|
| [`tiny-rag.ts`](tiny-rag.ts) | The single-file version. Embeds `corpus/plain/`, scores, takes the top 2, answers. |
| [`cosine.ts`](cosine.ts) | Cosine similarity, three accumulators and one division, with the dimension guard. |
| [`tiny-search.ts`](tiny-search.ts) | `Shelved`, `Scored`, and the linear scan. |
| [`embed.ts`](embed.ts) | `embedPassages` and `embedQuestion` over one client. Chapter 6 replaces the client. |
| `run-examples.ts` | **Not from the book.** Runs `cosine` and `tinySearch` on shipped vectors, with no key. |
| `fixtures/shelf.json` | **Not from the book.** Eight-dimension hand-written vectors. Not embeddings. |

## Run it

The chapter's own listing calls two providers:

```bash
npm run run-example -- ch02
npm run run-example -- ch02 "how do I return a wheel"
```

The keyless half needs nothing at all:

```bash
npm run run-example -- ch02/run-examples
```

## Expected output

`tiny-rag.ts` prints one grounded paragraph. Ask it `"how do I return a wheel"` and it finds the shipping FAQ without anything mapping questions to files.

`run-examples.ts` prints the ranking for two questions, the unit-length check, and the dimension guard:

```text
Can I still claim if I bought the bike secondhand?
  0.9967  warranty.txt
  0.2317  shipping.txt
  0.0976  wheelset.txt

are these vectors unit length?

  0.955458  warranty.txt
  …

the dimension guard

  dimension mismatch: 3 vs 2
```

The lengths are not `1.000000`, which is the answer the chapter wants you to get from that check on *some* provider: check, do not assume, and write the full formula anyway.

## Notes

- The fixture vectors are hand-written so the arithmetic is checkable on paper. They are not model output, and no score printed by `run-examples.ts` says anything about the embedding model.
- `.slice(0, 2)` in `tiny-rag.ts` is a number somebody made up. Chapter 8 gives top-k a tuning loop.
- `ch04/sweep.ts` is the only later listing that imports `tiny-search.ts`.
