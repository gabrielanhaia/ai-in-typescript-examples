# ch11 — Cost you can compute, and cost you can cut

Rates in a dated file, cost as one function over the tokens you already measured,
and a simulator so you can price a strategy before you ship it.

## Run it

```bash
docker compose run ai-that-answers ch11          # no key needed
docker compose run ai-that-answers ch11/verify-cache
```

Locally, from `ai-that-answers/`: `npm run run-example -- ch11`.

| File | What it does | Needs a key |
|---|---|---|
| `run-examples.ts` | Driver for the pure modules below. **Not a listing from the book.** The chapter default. | no |
| `rates.ts` | Published rates with a `VERIFIED_ON` date beside them. | no |
| `cost.ts` | Cost of one call, from chapter 10's `Spend`. | no |
| `usage.ts`, `count.ts` | Chapter 10's `spendOf` and `countTokens`, re-exported so the listings import `./usage.js` and `./count.js` exactly as printed. | no |
| `simulate.ts` | Cost across N turns under full replay, a sliding window, or a running summary. | no |
| `budget.ts` | From a target cost per conversation to an input ceiling per turn. | no |
| `enforce-budget.ts` | Wires that ceiling to chapter 3's trim. | no |
| `running-total.ts` | The chat loop with per-turn and conversation-total cost. | yes |
| `price-the-prompt.ts` | Annual cost of one system prompt at a given volume. | yes |
| `cached-chat.ts` | Prompt caching turned on: a call option, not a constructor option. | yes |
| `verify-cache.ts` | Two identical calls, printing the cache numbers. | yes |

## Expected output

`run-examples.ts` needs no key and prints exactly this, on every machine:

```
rates verified 2026-07-25: claude-haiku-4-5 = $1/$5 per MTok in/out

one call, 1,200 in / 300 out
  $0.002700

20 turns, three history strategies
  full replay              $0.056
  sliding window (6)       $0.038
  running summary (6+200)  $0.042

The bounded strategies win by a third, not an order of magnitude:
output costs five times input, and trimming only acts on input.
The running summary costs MORE than the window it replaces.

input budget per turn, from a target cost per conversation
  $0.01 over 20 turns -> 0 tokens/turn  (answers alone already exceed the target)
  $0.05 over 20 turns -> 1750 tokens/turn
  $0.20 over 20 turns -> 9250 tokens/turn
```

The zero is a result, not a failure: at 150 output tokens across 20 turns the
answers alone come to $0.015, which is already past a one-cent target before a
single input token is counted. Trimming history cannot get you there — only a
shorter answer or a different tier can.

`verify-cache.ts` prints two lines:

```
first   uncached NNN  written 0  read 0  $0.000NNN
second  uncached NNN  written 0  read 0  $0.000NNN
```

**Both lines identical, with zeros in `written` and `read`, is the expected
result here and it is the lesson.** The minimum cacheable prefix on `claude-haiku-4-5`
is 4,096 tokens; this prompt is far shorter, so nothing caches — silently, with
no error and no warning. Pad the system prompt past 4,096 tokens and the second
line's `read` becomes non-zero and its cost falls. Never assume a cache hit; the
only symptom of not getting one is a bill that did not fall.
