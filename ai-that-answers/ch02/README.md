# ch02 — Your first call, in one file

The smallest project that makes a real call, then the three additions the chapter
makes to it: the question comes from the command line, the accounting goes to
standard error, and the round trip is timed.

The chapter's `package.json` and `tsconfig.json` are this directory's
[`../package.json`](../package.json) and [`../tsconfig.json`](../tsconfig.json) —
one manifest serves all fourteen chapters, with the same pins the chapter prints.

## Run it

```bash
docker compose run ai-that-answers ch02
docker compose run ai-that-answers ch02/ask-minimal
```

Locally, from `ai-that-answers/`:

```bash
npm run run-example -- ch02
npm run run-example -- ch02 "Explain optimistic locking in two sentences."
```

| File | What it does | Needs a key |
|---|---|---|
| `ask.ts` | Question from `argv`, answer on stdout, accounting on stderr. | yes |
| `ask-minimal.ts` | The first listing: one fixed question, one `console.log`. | yes |

## Expected output

`ask-minimal.ts` prints two sentences on standard output and nothing else.

`ask.ts` prints the same answer on standard output, then on standard error:

```
{ input_tokens: 34, output_tokens: 71, total_tokens: 105 }
end_turn

[34 in / 71 out = $0.000389 at 2026-07-24 rates]
[NNNN ms wall clock]
```

*(Those token counts are the ones the chapter prints; yours will differ.)*

The token counts and the milliseconds change every run; `stop_reason` should be
`end_turn`. If it is `max_tokens` the answer was cut off — that is chapter 12's
lesson arriving early. Because the accounting is on standard error, `npm run
run-example -- ch02 > answer.txt` gives you a file with only the answer in it.

Run with no argument and it prints the usage line and exits `1` without calling
the model:

```
Usage: npm run ask -- "your question"
```
