# Chapter 11 — Citations the reader can trust

A footnote pointing at a passage that does not carry the sentence above it collects trust it has not earned — more damage than leaving the sentence bare. These are the instruments that surface it.

| File | What it does |
|---|---|
| [`identity.ts`](identity.ts) | `Citable`, a `Pick` of four fields, and `locationOf` — a page range or a heading trail. |
| [`render.ts`](render.ts) | Markers to citations, and `unknownMarkers` for the ones the model invented. |
| [`render.test.ts`](render.test.ts) | Three tests. Milliseconds, no network, no key. In `npm run verify`. |
| [`support.ts`](support.ts) | `claimCoverage` — what share of a claim's lexemes appear in the cited chunk. |
| [`quote.ts`](quote.ts) | `supportingSpan` — `ts_headline`, and the guard against its silent lie. |
| [`answer-key.ts`](answer-key.ts) | Reads `corpus/questions.jsonl`. |
| [`cite-check.ts`](cite-check.ts) | `scoreCitations`: supported rate and authoritative rate, reported separately. |
| `run-examples.ts` | **Not from the book.** The rendering half, keyless. |

## Run it

Keyless:

```bash
npm run run-example -- ch11
```

`support.ts` and `quote.ts` are SQL over the `chunks` table, so they need Postgres and an ingested corpus. They need **no API key**.

## Expected output

`locationOf` per source kind, then four answers through `renderAnswer`:

```text
  a good answer
    The 30-day window runs from the delivery date recorded by the carrier, not from the order date [1]. …
      [1]  Staff handbook, 4. The returns desk, The returns desk › The window
      [2]  Terms of sale 2026, pp. 2-3

  a marker the model invented
    The window is 30 days [1] and returns are free [7].
      [1]  Staff handbook, 4. The returns desk, The returns desk › The window
      unresolvable: [7]

  a refusal
    I don't know from the documents I have.
      no footnotes, and that is correct: this is a refusal

  a contract violation
    Returns are free and take about a week to process.
      no footnotes, and that is a CONTRACT VIOLATION — count it
```

Zero markers means one of two things. Either the model declined, which is working as designed, or it answered and cited nothing, which is a breach. The text looks identical in both cases; matching chapter 10's fixed refusal sentence is what separates them.

Then `scoreCitations` against the real answer key, on `q01`:

```text
  cites the authoritative file         authoritative=true  supporting=true
  cites a supporting near-duplicate    authoritative=false supporting=true
  cites something else entirely        authoritative=false supporting=false
```

The middle row is the failure the chapter opened with.

### `claimCoverage`, against the ingested corpus

Best chunk per candidate file, for the answer sentence about the window being counted from the carrier's recorded delivery date rather than the order date, measured on this repo at chunk size 900/135 (2026-07-25):

| Cited passage | Coverage |
|---|---|
| `markdown/staff-handbook/04-returns-desk.md` | 1.00 |
| `pdf/terms-of-sale-2026.pdf`, clause 5.2 | 0.89 |
| `html/faq.html` | 0.33 |

Both passages holding the detail the question turns on land near the top. The look-alike lands at a third — even though it covers returns, quotes thirty days, and mentions delivery, which is the entire set of signals available to a ranker.

Coverage is a ratio over the *chunk's* lexemes, so it moves with chunk size; the separation is the finding, not the third decimal place.

`supportingSpan` on the returns desk chunk returns the sentence with the matching lexemes bracketed, and returns `null` — not a misleading fragment — when nothing matches. That guard is the `!span.includes("[[")` in the listing: with nothing to match, `ts_headline` returns the *start of the field*, which a caller that renders unconditionally will show a reader as a supporting quote.

## Notes

- **`chunkId.split("#")[0]` recovers the `sourceId`.** That works because chapter 4 built the ID from the source path plus a position rather than from a UUID or a hash.
- **`metadata.chunkId` is corpus-relative, and it has to be**, because `questions.jsonl` spells its `file` that way. `ch13/sync.ts` restamps `sourceId` from `scanCorpus` before chunking, which is the single place that identity is decided; without that restamp the loaders' `corpus/markdown/x.md` reaches `chunkId` and `scoreCitations` reports `false` for everything. See [`../ch12/README.md`](../ch12/README.md).
- **Uncited candidates never reach the footnotes.** List all five passages you retrieved and you have implied that five documents back the answer, when two did and the other three were ranked highly and then not used.
- `claimCoverage` is a **lint, not a proof**. Lexeme overlap is blind to polarity, so a passage that negates your sentence word for word scores 1.00. Do not take a threshold from this page; run it across your own question set and pick a value that flags the tail.
- Do not parse markers incrementally while streaming. A partial stream can contain `[1` and nothing else yet. Buffer the answer and run `renderAnswer` once at the end.
