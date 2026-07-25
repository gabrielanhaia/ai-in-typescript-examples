# ch12 — Errors, retries, timeouts, and rate limits

Read the stop reason before the content, classify the error before retrying it,
and choose the retry policy you are already shipping with.

## Run it

```bash
docker compose run ai-that-answers ch12
```

Locally, from `ai-that-answers/`:

```bash
npm run run-example -- ch12       # measure-retries.ts
npm test                          # classify.test.ts, no network, milliseconds
```

`measure-retries.ts` needs `ANTHROPIC_API_KEY` to be set but **sends nothing to
the provider** — it points the client at a local server that returns 500 forever.
The constructor requires a key even when no request will leave the machine, so
any non-empty value works.

| File | What it does | Needs a key |
|---|---|---|
| `measure-retries.ts` | Times the retry policy you did not choose, against a local 500 server. The chapter default. | to construct only |
| `finish.ts` | `stop_reason` as a named outcome, including the fourth value. | no |
| `describe.ts` | The four fields worth logging off an `APIError`. | no |
| `classify.ts` | The taxonomy in code: retry, fix, or abandon. | no |
| `classify.test.ts` | Three tests, no network. | no |
| `backoff.ts` | Exponential backoff and jitter, kept as two separate ideas. | no |
| `chosen-policy.ts` | `maxRetries`, `maxConcurrency` and a 30-second timeout, chosen rather than inherited. | yes |
| `deadlines.ts` | Two deadlines, because a stream fails by going quiet. | no |
| `stream-with-deadlines.ts` | The deadlines in use on a real stream. | yes |
| `policy.ts` | `INTERACTIVE` and `BATCH`, decided once and carried into chapter 14. | no |

## Expected output

`measure-retries.ts` prints one line after it has finished waiting:

```
attempts=7 gaps=1100,2600,5400,10500,18400,44400 total=82400ms
```

A second run of the same file in this repo's container, 2026-07-25, at the pinned
versions:

```
attempts=7 gaps=1736,2532,5184,13472,27681,46167 total=96801ms
```

**Seven attempts, a minute and a half, and no line of your code asked for it.**
Compare the two runs above: the individual gaps differ, because each wait is
multiplied by a random factor, and every gap still lands inside `1000 * 2^(n-1)`
to twice that. So expect your own numbers to differ and the bands to hold.
Whether a minute and a half of waiting is correct depends entirely on what you
are writing, which is why `chosen-policy.ts` sets it explicitly.

Because it waits out the full backoff, the run takes over a minute. That is the
point of it.

`classify.test.ts` runs inside `npm test`:

```
 ✓ ch12-errors-retries-timeouts/classify.test.ts (3 tests)
```

The third test is the interesting one: an `APIError` with **no status** is what a
mid-stream error looks like, and it is transient, not a defect.
