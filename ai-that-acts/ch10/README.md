# ch10 — The same loop, with the framework

Six chapters of machinery as one function call and a list, and the three
places the mapping is not clean.

| File | What it does | Needs |
|---|---|---|
| [`tools.ts`](tools.ts) | The same handlers, with the metadata second instead of first. | — |
| [`agent.ts`](agent.ts) | `createAgent`, two middlewares, and `signal`. The field is `systemPrompt`, not `prompt`. | key |
| [`run.ts`](run.ts) | Chapter 4's message array in framework clothes. The chapter default. | key |
| [`observe.ts`](observe.ts) | Chapter 4's `trace`, rewritten for the framework's message types. | key |
| [`budget-middleware.ts`](budget-middleware.ts) | The row the mapping table left empty. There is no token-budget middleware. | — |
| [`hitl.ts`](hitl.ts) | `humanInTheLoopMiddleware`, to be read and not run. See below. | — |
| [`tool-runner.ts`](tool-runner.ts) | The SDK's middle rung. Beta; the import path is the detail that costs twenty minutes. | key |
| `system.ts` | **Not from the book.** Re-exports chapter 4's string, so both loops are pointed at one file. | — |

## Run it

```bash
npm run run-example -- ch10
npm run run-example -- ch10/observe
npm run run-example -- ch10/tool-runner
```

## Expected output

`run.ts` prints four messages: `human`, `ai`, `tool`, `ai`. That third line is
a result block that has been **lifted out** of its user message and given a
message of its own. It is the one shape change worth knowing about: three
simultaneous calls become three separate entries in the framework's state and
are folded back into a single user message by the binding before the request
goes out.

`observe.ts` prints `-> tool args` and `<- tool result` per step, which is what
chapter 6 asked you to log and the only evidence of what the model was working
from.

## What is not here

One small thing to expect: when the model names a tool that does not exist,
the message reads `Error: nope is not a valid tool, try one of
[get_order_status, issue_refund].` — **both** names, because `TOOLS` has two
entries in it.

**`ch10/hitl.ts` is not wired into anything and cannot be.** An agent carrying
that middleware and nothing else throws `GraphValueError: No checkpointer set`
on the first gated call, and the in-memory checkpointer that satisfies it is
exported from `@langchain/langgraph` — which is deliberately not in this
`package.json`, because durable state is Book 4. The chapter says so; the file
is here to be read beside `ch08/gate.ts`.

For the same reason the `new Command({ resume: … })` block the chapter prints
has no file: it needs a checkpointer to run, and shipping a listing that
throws would be worse than not shipping it.

**The claim this chapter ends on is checked in `ch14/same-surface.ts`**, which
costs nothing and reaches nothing.
