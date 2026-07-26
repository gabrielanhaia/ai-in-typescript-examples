# ch04 — The agent loop, by hand, in thirty lines

Call the model, branch on `stop_reason`, run the batch concurrently, append
every result in one user message, repeat under a ceiling.

| File | What it does | Needs |
|---|---|---|
| [`loop.ts`](loop.ts) | `runAgent`. Thirty lines, counted as printed. | key |
| [`run.ts`](run.ts) | Points it at a task from the command line and prints the per-step usage. The chapter default. | key |
| [`trace.ts`](trace.ts) | Prints the message array one line per message. The most useful debugging tool in the book. | — |
| [`turn.ts`](turn.ts) | All eight arms of `stop_reason`, as a discriminated union. | — |
| [`system.ts`](system.ts) | The five rules. `ch14/system.ts` is this plus chapter 8's sentence and chapter 12's clause. | — |
| [`one-at-a-time.ts`](one-at-a-time.ts) | Where `disable_parallel_tool_use` goes: inside `tool_choice`, not at the top level. | — |
| [`break-batch.ts`](break-batch.ts) | The belt-and-braces `.catch` the book deliberately does not ship. | key |
| [`stale-id.ts`](stale-id.ts) | A bug on purpose: an id held across iterations. Compiles cleanly, rejected by the API. | key |
| [`split-results.ts`](split-results.ts) | A bug on purpose: one `tool_result` per message. Works with one call; breaks with two. | — |

## Run it

```bash
npm run run-example -- ch04
npm run run-example -- ch04 "What do you sell?"
npm run run-example -- ch04 "ORD-4471 turned up damaged. What now, and can I get the money back?" --trace
```

## Expected output

The first task finishes in one step and leaves one message: the model has
tools and uses none of them. The second takes two steps and three messages.
The third takes three or four, and **a different number on different runs** —
same code, same question, different traces. Run it five times and record the
count; the spread is the property that makes an agent an agent.

`--trace` prints the transcript. Watch the roles alternate, and count the
`tool_result(error)` lines: a single one means the loop corrected itself,
while three consecutive ones against the same tool mean it is going nowhere.

The two deliberate bugs need a key because they fail at the API, which is the
point of them. `split-results.ts` needs nothing; it is a function you can call
from a test.
