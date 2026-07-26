# ch07 — When tools fail: errors, retries, idempotency

Three classes of failure with three different answers, a batch that answers
every call even when one of them throws, and a write that happens once.

| File | What it does | Needs |
|---|---|---|
| [`result.ts`](result.ts) | `ok` and `failed`. One flag between them; everything difficult is in the string. | — |
| [`classify.ts`](classify.ts) | The status table, and `HttpFailure` — `message` for your logs, `forTheModel` for the wire. | — |
| [`run-one.ts`](run-one.ts) | `repair`, and the executor every later chapter wraps. Never throws. | — |
| [`attempt.ts`](attempt.ts) | Retries beneath the tool, where a retry costs a socket and not a model call. | — |
| [`batch.ts`](batch.ts) | `Promise.allSettled`, mapped over `calls` and not over `settled`. | — |
| [`naive.ts`](naive.ts) | The catch in the wrong place. Three tools run, two succeed, and the run cannot continue. | — |
| [`refund.ts`](refund.ts) | The `fetch` with the idempotency key on it, and the tool around it. | service |
| [`streak.ts`](streak.ts) | A counter and a better sentence after the second failure in a row. | — |
| [`result-shape.ts`](result-shape.ts) | The printed block shape, as a compile-time check. Nothing runs it. | — |
| `run-examples.ts` | **Not from the book.** The chapter's three keyless claims, run. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch07
```

## Expected output

The status table, then the repair sentence, then the invariant:

```text
  toolu_get_order_status   ok       dispatched
  toolu_check_stock        is_error The stock service is not answering.
  toolu_search_docs        ok       the returns window

  3 results for 3 calls, in the order asked.
```

One tool in three threw and all three were answered, in the order they were
requested. Change `batch.ts` to map over `settled` instead of over `calls` and
that ordering is the thing that breaks.

## Where the key comes from

The chapter says the identifier with the right lifetime is the `tool_use`
block's `id`, held by the executor across every retry and across nothing else.
`run-one.ts` keeps it in an `AsyncLocalStorage` and `refund.ts` reads it back,
which means no schema anywhere exposes it. Put such a field on a schema and it
gets a new random value each time the model tries again — the precise
opposite of what the mechanism needs.

Prove it against the running service: post the same refund twice under one key
and the second answer is `repeat: true` with the first refund's id.
