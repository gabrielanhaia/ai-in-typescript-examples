# Chapter 12 — Is it actually working?

Thirty-five questions, two numbers, and one question that decides what to fix.

| File | What it does |
|---|---|
| [`questions.ts`](questions.ts) | Reads `corpus/questions.jsonl`; `scorable` and `unanswerable`. |
| [`match.ts`](match.ts) | `supports` — the file *and* the key, with whitespace and case flattened. |
| [`score.ts`](score.ts) | `rankOf`, `recallAt`, `mrrAt`. |
| [`score.test.ts`](score.test.ts) | Three tests encoding the three decisions. In `npm run verify`. |
| [`measure.ts`](measure.ts) | The harness. One line to swap the stage under measurement. |
| [`triage.ts`](triage.ts) | `explain(id, k)` — the wanted passage, and the ten things that came back instead. |
| `run-examples.ts` | **Not from the book.** The scorer, over the real corpus, with no key and no store. |

## Run it

Keyless:

```bash
npm run run-example -- ch12
```

The real harness needs Postgres, `OPENAI_API_KEY` and `COHERE_API_KEY`, and an ingested corpus. **It never calls the answering model**:

```bash
npm run run-example -- ch12/measure
```

## Expected output

The composition of the shipped set, which is where the chapter's denominators come from:

```text
   35  lines in the file
   30  grounded
    5  answer is not in the corpus
    2  answerable only from a scanned page
   28  scorable: grounded and reachable without OCR
    1  needs every supporting passage, not just one
   16  stated more than once in the corpus
```

Then the chapter's worked example, run: `recall@5 0.667`, `MRR 0.417`.

Then a corpus check — is the ground truth even reachable?

```text
  every key in all 28 scorable questions is present in a chunk
```

Then a real table, from a deliberately unsophisticated keyless retriever defined at the bottom of `run-examples.ts` — bag of words, no embeddings, no database, no synonyms:

```text
  31 documents, 34 loaded units, 161 chunks at 900/135

28 questions scored at k=10
k	recall	MRR
1	0.536	0.536
3	0.607	0.571
5	0.821	0.621
10	0.821	0.621
```

**That is a floor, not a result.** It is here because a scorer that has never been run against real ground truth is a scorer you are trusting, and because the shape it produces is the one the chapter tells you to read: recall climbing to 0.821 and stopping, MRR well below it, which is "the material is being found and badly ranked" — the reranker's case exactly. Run `measure.ts` to find out by how much chapters 5 to 9 beat it on your machine.

Tabs between the columns, so a copy out of the terminal lands in a spreadsheet already in cells. Write today's date and the six-value configuration beside it — chunk size, overlap, embedding model, dimensions, hybrid on or off, reranker on or off — or the number is a souvenir rather than a baseline.

One question is **3.6 points of recall**. Refuse to act on a difference smaller than that.

## The `sourceId` mismatch

`supports` compares `hit.sourceId` against `questions.jsonl`'s `file`, which is spelled `markdown/warranty-policy.md`. Two of the book's own listings disagree about that spelling:

- **`ch13/scan.ts`** sets `sourceId: relative(root, path)` → `markdown/warranty-policy.md`. ✅
- **`ch03/load-*.ts`** set `sourceId: path` — the path they were handed. Driven from the package root that is `corpus/markdown/warranty-policy.md`. ❌

In the live pipeline the column wins and `measure.ts` is unaffected: `ch13/store.ts` writes `source_id` from `scanCorpus`, and `ch08/hit.ts` reads `Hit.sourceId` out of that column. It is the copy inside the metadata JSON — and therefore `metadata.chunkId` — that carries the extra segment, which is what breaks chapter 11's `scoreCitations`.

`run-examples.ts` strips the prefix, with the reason written beside it, because it reads `metadata.sourceId` directly rather than going through the store.

## Notes

- `questions.ts` keeps the file's own field names, snake case included. Put a renaming layer between the scorer and the ground truth and you have created somewhere for a defect to sit where no output would ever show it.
- `rankOf` returns `undefined` for a miss, not `0` or `-1`: `0` is a legal-looking rank arithmetic will divide by, and `-1` sorts before every real answer.
- `recallAt` and `mrrAt` take the ranks and a `k`, so one run at `k = 10` gives you every `k` up to ten for free.
- The single `requires_all` question is scored at whichever of its two passages came back **second**, since neither half answers it alone.
- **The five null questions are not in this table.** They are scored on refusal rate, by a person reading five answers, and that number is kept separate from recall on purpose.
