# ch02 — Your first tool call, on the wire

A single tool, one exchange, and nothing hidden. The provider's client
library, a schema typed out longhand, and the message ordering done manually
before `ch04` wraps it in a loop.

| File | What it does | Needs |
|---|---|---|
| [`first-call.ts`](first-call.ts) | Sends one tool definition and prints the whole response, `tool_use` block and all. The chapter default. | key |
| [`tool.ts`](tool.ts) | The definition again, exported, plus `lookUpOrder` — a function that knows nothing about models. | — |
| [`round-trip.ts`](round-trip.ts) | The whole thing: call, `stop_reason: "tool_use"`, run the function, send the result back in a `user` message, read the answer. | key |
| [`count-tokens.ts`](count-tokens.ts) | What the definition costs, measured. Prints the count with the tool and without it. | key |
| [`capture.ts`](capture.ts) | Five lines of monkey-patching that print every outgoing request body. Import it at the top of any listing. | — |
| [`report-failure.ts`](report-failure.ts) | The catch that turns an exception into a `tool_result` with `is_error` on it. | — |

`count-tokens.ts` and `report-failure.ts` are printed in the chapter without a
filename; everything else is printed as a named file.

## Run it

```bash
npm run run-example -- ch02
npm run run-example -- ch02/round-trip
npm run run-example -- ch02/count-tokens
```

## Expected output

`first-call.ts` prints a JSON response whose `content` array has two blocks —
an optional `text` block and a `tool_use` block — and `stop_reason:
"tool_use"`. The `tool_use` block carries `id`, `caller`, `name` and `input`.
Read `stop_reason` first; the array is a widening and indexing into it is the
habit the rest of the book is written against.

`round-trip.ts` prints one sentence: the order shipped with Evri, and the
tracking number. Nothing loops, nothing is validated, and the `as { order_id:
string }` cast in it is a lie the chapter tells on purpose — `ch03` replaces
it with a parse.

`count-tokens.ts` prints two numbers. The difference is what one small tool
definition costs, on every request of every step.

## Where this differs from the page

The chapter opens with `node --env-file=.env --import tsx ch02/first-call.ts`.
That form **fails outright when there is no `.env`** — `node: .env: not
found` — so the commands above use `npm run run-example`, which passes
`--env-file-if-exists` for both `../.env` and `.env`. Use
`node --env-file-if-exists=.env --import tsx ch02/first-call.ts` if you would
rather not go through npm.
