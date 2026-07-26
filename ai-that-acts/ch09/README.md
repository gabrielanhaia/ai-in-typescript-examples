# ch09 — Loop control: steps, budgets, timeouts, cancellation

Three limits that trip for different reasons, an abort signal built from the
same parts, and a check for the one pattern all three miss until it is
expensive. Not one of them is expressed as text the model sees.

| File | What it does | Needs |
|---|---|---|
| [`limits.ts`](limits.ts) | `Limits`, the two profiles, and the `Ledger` whose `exceeded()` returns *which* ceiling tripped. | — |
| [`repeats.ts`](repeats.ts) | A signature that survives key order, a cache, and `stalled` as a `Stop` like any other. | — |
| [`batch.ts`](batch.ts) | Chapter 7's batch with the repeat cache in front of `runOne`. No gate: that is chapter 14. | — |
| [`conclude.ts`](conclude.ts) | A closing request that still sends the definitions but sets `tool_choice: { type: "none" }`, leaving no way back into the loop. | key |
| [`rates.ts`](rates.ts) | Two numbers and the date they were read. The introductory rate ends 2026-08-31. | — |
| [`run.ts`](run.ts) | Three independent reasons to stop, composed into one signal, and the `abort()` that closes the sockets afterwards. | — |
| [`framework-limits.ts`](framework-limits.ts) | What the framework calls two of these. | — |
| `agent.ts` | **Not from the book.** The chapter-9 loop, assembled — ledger, stall detector and `conclude`, no gate. `ch13` calls it. | key |
| `run-examples.ts` | **Not from the book.** Each ceiling fired on its own. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch09
npm run run-example -- ch09/run
```

## Expected output

Each ceiling tripping, then the arithmetic that catches people:

```text
  input 4000 + output 500 + cache read 1200 = 5700
```

Four counters, not the obvious two. Once the definitions are stable enough to
cache, the cached-read figure dominates every step past the first, so a budget
built from the other two numbers never trips.

Then the repeat detector: attempt one executes, attempt two returns the stored
answer with an explanation attached, attempt three ends the run. Three rather
than two, because asking the same question twice is often just confirmation
before acting.

`ch09/run.ts` prints the composed signal before and after the run ends. The
`abort()` at the end is not tidiness — without it the run has finished and the
process is still paying for tool calls nobody is waiting for.
