# ch06 — Prompt technique that survives a model change

A tally sheet instead of an opinion: a fixed input set, binary checks, two whole
prompts written down as data, and a comparison you can re-run after any change.

## Run it

```bash
docker compose run ai-that-answers ch06
```

Locally, from `ai-that-answers/`: `npm run run-example -- ch06`.

**This is the most expensive example in the book.** 22 inputs × 3 runs × 2
variants = **132 calls**, each one a short system prompt and a one-line answer,
and it takes a few minutes. This README does not print a dollar total, because
that would be a number nobody measured on your account — run
`docker compose run ai-that-answers ch11` first and it will show you the
arithmetic, then multiply. Lower `RUNS_PER_INPUT` in `compare.ts` to try it more
cheaply.

| File | What it does | Needs a key |
|---|---|---|
| `compare.ts` | Runs both variants and prints the tally. The chapter default. | yes |
| `score.ts` | The harness: one call per run, one pass/fail per check. | yes |
| `inputs.ts` | The fixed input set. The chapter's twelve come first and verbatim; the rest is the larger set the chapter says lives here. | no |
| `checks.ts` | Five binary checks. Not a score out of ten. | no |
| `variants.ts` | Baseline and candidate, as whole prompts. | no |
| `model-change.ts` | Moving the harness to `claude-sonnet-5` — one line, plus the `temperature` you must delete. | yes |

## Expected output

Two blocks, one per variant, each with `22 × RUNS_PER_INPUT` runs:

```
baseline  (66 runs)
  single line       66/66  100%
  known label       NN/66   NN%
  no preamble       NN/66   NN%
  under 40 words    66/66  100%
  no price quoted   66/66  100%

candidate: explicit unknown-handling  (66 runs)
  single line       66/66  100%
  known label       NN/66   NN%
  no preamble       NN/66   NN%
  under 40 words    NN/66   NN%
  no price quoted   66/66  100%
```

**No pass rates are printed here on purpose.** They depend on the model snapshot,
the prompt, and the day, and a figure from someone else's run is not a
measurement you can act on. What the tally is *for* is the shape of the trade,
and it is usually this: the candidate fixes the check you targeted
(`known label`) and costs you a little on one or two you did not (`no preamble`,
`under 40 words`). Write down the decision rule *before* you look, or you will
find a reason to like whichever column is prettier.

Four inputs are in the set to fail, and watching which variant admits it is the
point of the exercise: the empty string, `"my bike was stolen, what should I
do"`, `"can you give me a discount code"` and `"how much does a chain weigh"` are
not symptoms, so a category is a guess. One more —
`"is the 2019 frame compatible with a 12-speed cassette"` — needs the frame's
rear spacing, which nobody has been told. That is the input chapter 14 comes back
to when it moves the app up a tier, because no prompt edit in this repo closes
it.
