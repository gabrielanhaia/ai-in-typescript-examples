# ch08 — Permissions, dry-runs, and blast radius

Four independent pieces that execute ahead of the handler: a rung per tool
scored on the cost of reversing it, a halt, a preview, and a token narrow
enough to make the worst case bearable.

| File | What it does | Needs |
|---|---|---|
| [`ladder.ts`](ladder.ts) | Five rungs, three lanes, and the rung of every tool on the surface. | — |
| [`policy.ts`](policy.ts) | `decide` — a pure function of the tool name and the arguments. No network, no clock. | — |
| [`gate.ts`](gate.ts) | Twenty lines. `run` is a thunk, so nothing runs before a lane is chosen. | — |
| [`plans.ts`](plans.ts) | The dry-run: every read the real call would run, none of the writes, one paragraph. | — |
| [`cli.ts`](cli.ts) | The inline reviewer. Default no, a timeout that declines, and `rl.close()` in a `finally`. | — |
| [`batch.ts`](batch.ts) | Chapter 7's batch with one expression changed. | — |
| [`audit.ts`](audit.ts) | Seven fields, written **before** the tool runs. | — |
| [`credentials.ts`](credentials.ts) | A write token minted after approval, for one `tool_use` id, good for ninety seconds. | — |
| `run-examples.ts` | **Not from the book.** Every lane, the argument that moves one, and the paragraph a reviewer reads. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch08
```

## Expected output

Every tool and the lane it takes, then the same tool at four amounts:

```text
    1500  log      refund at or under £20
    2000  log      refund at or under £20
    2001  confirm  issue_refund is irreversible
    8900  confirm  issue_refund is irreversible
```

Then a tool nobody put on the ladder, which takes the **confirm** lane and
says so by name — the correct direction to be wrong in, and worth comparing
against what an `?? "auto"` default would have done.

Then the paragraph:

> Refund £89.00 against order ORD-4471 (damaged). The order total is £89.00
> and its status is dispatched. This cannot be undone from here.

That is something a reviewer can disagree with in public, which is the only
job a confirmation prompt has.

## The gate in a real run

`ch14/cli.ts` wires `cliReviewer` in. Decline the first prompt: the run keeps
going, the reply explains that the money needs sign-off from someone else, and
the answer arrives anyway. Then leave the prompt untouched for two minutes and
watch the deadline refuse it for you.

The dry-run flag is **not** a schema field, and that is the load-bearing
decision in this chapter. `plan` and `run` are two functions and the gate
decides which is called; the model has never heard of the second map.
