# ch12 — Retrieval as just another tool

The previous book's retriever joins chapter 5's surface as a seventh entry.
From here on, whether a search happens at all is a decision made per request
instead of one baked into the code path.

| File | What it does | Needs |
|---|---|---|
| [`search-tool.ts`](search-tool.ts) | One `defineTool` call with `retrieve` behind it. No `k`, no source filter, no `where`. | — |
| [`session.ts`](session.ts) | Chapter 6's session, one tool longer, with the citation map threaded in. | — |
| [`passages.ts`](passages.ts) | A label rather than a number, because a number does not survive a second search. | — |
| [`cited.ts`](cited.ts) | Resolves the labels in an answer against the run's source map, and reports the ones it cannot. | — |
| [`cited.test.ts`](cited.test.ts) | An invented label is reported, not dropped. In `npm run verify`. | — |
| `run-examples.ts` | **Not from the book.** The chapter without the model. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch12
```

Keyless. It reaches [`../retrieval/index.json`](../retrieval) and nothing else.

## Expected output

First, the customer's message scored against the query a model writes from it.
The rewritten query ranks `[Warranty policy, Crash replacement]` far above
everything; the message as typed does not, because three sentences of
annoyance and one question embed as mostly annoyance. That behaviour comes
from **one clause** in the field's `.describe()`.

Then the second search:

```text
  disc brake rub after rotor change
    -> [Warranty policy, Consumables]
  rear adapter 180 mm Halvard R4
    -> [Workshop service bulletins, 2026, 2026-04 — Rear caliper mount adapters, Halvard R4]
```

The first looks reasonable and helps with nothing. The second lands on the
bulletin that names `BRK-1180`, reached because the earlier results supplied
the vocabulary the index is written in.

Then the source map after four searches. Nothing collides: the key is a
location, so the same passage retrieved twice keys the same way. Beside it the
resolver separates genuine labels from `[Warranty policy, Section 9]`, which
is invented. Anything unresolved is written to standard error and kept out of
the reply.

## The failure that did not exist before

Whatever recall your question set reports is now scaled by something you have
not counted: the share of runs where the tool was called at all. Keep the two
scores apart — *was a search made*, and *did the search return the passage* —
and record a policy question answered without one as a failure even when the
wording came out right. Marking those as passes is exactly how the problem
goes unnoticed.
