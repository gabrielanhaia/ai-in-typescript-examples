# ch07 — What "memory" actually means

Two kinds of memory and no third. **Short-term** is the thread: checkpoints
written by the checkpointer, scoped to one `thread_id`. **Long-term** is a
store: key–value records under a namespace, readable from any thread, with no
`thread_id` anywhere in the picture. This directory is both of them side by
side, plus the two things that go wrong once a thread stops being short —
trimming what the model sees, and compacting what the thread holds.

| File | What it does | Needs |
|---|---|---|
| [`store.ts`](store.ts) | The whole `BaseStore` surface, exercised outside any graph. No graph, no thread, no model. | — |
| [`namespaces.ts`](namespaces.ts) | Three functions. Every namespace in the application is built here, never by a literal. | — |
| [`state.ts`](state.ts) | `customerId`, `known`, `summary` beside `messages`. Two of the three default, which is the point. | — |
| [`graph.ts`](graph.ts) | `store` sitting beside `checkpointer` in one `compile()` — the clearest statement the API makes about the two being peers. | anthropic |
| [`recall.ts`](recall.ts) | `getStore(config)`, read once at the top of the run. Note the `if (!store) return {}`. | — |
| [`remember.ts`](remember.ts) | The schema, and the node that writes facts with provenance and a model-chosen slug for a key. | anthropic |
| [`durable.ts`](durable.ts) | `PostgresSaver` and `PostgresStore` — the same package, one of them behind a subpath export. `defaultTtl` is in minutes. | postgres |
| [`window.ts`](window.ts) | `trimMessages`. Shortens what the model sees; the thread on disk is untouched. | — |
| [`compact.ts`](compact.ts) | The tombstone: `RemoveMessage` carrying `REMOVE_ALL_MESSAGES`, plus the last six turns in the same write. | anthropic |
| [`forget.ts`](forget.ts) | Both kinds, or neither. `deleteThread` for the threads, a namespace prefix sweep for the store. | — |
| `plan.ts` | **Not printed.** Chapter 2's plan node, in this chapter's state — see "Files the prose names" below. | anthropic |
| `shop.ts` | **Not printed.** One-line re-export of `../shop/tools.ts`, so `"./shop.js"` resolves here too. | — |
| `try-*.ts` | **Not printed.** The chapter's five "Try it" exercises — see below. | mixed |
| `run-examples.ts` | **Not from the book.** The chapter's keyless claims, run. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch07
```

That runs `run-examples.ts`. Any single listing runs by name — the chapter
prints this form for `store.ts`:

```bash
npm run run-example -- ch07/store
```

Equivalently, without the runner: `npx tsx ch07/store.ts`.

## Expected output

`run-examples.ts` prints four blocks. The store surface first — the two
timestamps are `Date` objects and will be today's:

```text
=== the whole store surface, outside any graph ===

{
  channel: 'email',
  language: 'en-GB',
  updatedAt: '2026-07-27T22:48:32.046Z'
} 2026-07-27T22:48:32.047Z 2026-07-27T22:48:32.047Z
[ 'braxby/customer/cust_4417/preferences:contact' ]
```

Then the namespace that was written one way and read another:

```text
=== break the namespace: no error, no warning, null ===

  wrote to   braxby/customer/cust_4417/prefs
  read from  braxby/customer/cust_4417/preferences
  got back   null
```

Then `search` quietly returning a quarter of what is there:

```text
=== watch search truncate: forty in, ten out ===

  wrote:                       40
  search(ns):                  10
  search(ns, { limit: 100 }):  40
```

And finally the two numbers that are supposed to diverge — the thread keeps
growing, the window stops at 40,000 tokens:

```text
  turn   thread   window   thread tokens
     5       10       10            6294
    30       60       60           37773
    35       70       62           44070
    50      100       62           62958

  getState says the checkpoint still holds 100 messages.
```

Every number above is deterministic and identical on every machine. Only the
two timestamps in the first block change.

## The five exercises

Three run with no key at all and are the three the chapter says fail with no
error — which is the reason to run them.

| Command | What to watch |
|---|---|
| `npm run run-example -- ch07/try-recall` | `known` is `[]` on `t1` and populated on `t2`. Nothing in `t2` said any of it. **Needs a key.** |
| `npm run run-example -- ch07/try-namespace` | `null`. No error, no warning. Then both namespaces listed, one namespace apart. |
| `npm run run-example -- ch07/try-truncation` | 40 written, 10 returned, and nothing in the result says so. |
| `npm run run-example -- ch07/try-window` | `thread` and `window` agree, then part company at turn 35. `getState` still holds all 100. |
| `npm run run-example -- ch07/try-compaction` | Whether the summary kept `HB-118`. **Needs a key**, and sends ~45,000 input tokens, because `compact` refuses to do anything below 40,000. |

`try-compaction` ends by telling you to lower `maxTokens` on the summarizer in
`compact.ts` to 256 and run it again. That edit is the exercise; the file does
not build a second summarizer to do it for you.

## Files the prose names but does not print

**`plan.ts`.** `graph.ts` imports it and the chapter never shows it, because
the prose says it is chapter 2's plan node — the same `claude-opus-5` binding,
the same `z.enum(STEP_NAMES)` guard. Two things this chapter forces: chapter
2's state had a `steps` field and this one does not, so the decided plan is
written back as an ordinary assistant turn; and it reads `state.known`, which
is the entire reason `recall` runs first.

**`shop.ts`.** `export * from "../shop/tools.js";` — no listing in this chapter
imports `"./shop.js"`, but `plan.ts` does, and the fixture documents both
import forms as ones a reader may copy.

## Running `durable.ts`

It is the one listing here that needs a database, and it is printed reading
`DATABASE_URL` — not this repo's `PLANS_DATABASE_URL`. Bridge the two at the
call site rather than editing the listing:

```bash
npm run db:up
DATABASE_URL="${PLANS_DATABASE_URL:-postgresql://braxby:braxby@localhost:5433/braxby}" \
  npm run run-example -- ch07/durable
```

It prints nothing and exits 0. The proof is in the database — `checkpoints`,
`checkpoint_blobs`, `checkpoint_writes`, `checkpoint_migrations` from the
saver, and `store`, `store_migrations` from the store. Two objects, two sets of
tables, one `setup()` each. Run it twice; both are idempotent.

With no `DATABASE_URL` set, `npx tsx ch07/durable.ts` throws `DATABASE_URL is
not set`, which is the printed behaviour and not a bug. Through the runner you
get the bridging command above instead: `scripts/run.ts` knows this is the one
listing in the book printed against a variable this repository publishes under
another name, and says so rather than letting it throw.

## What needs a key

`graph.ts`, `plan.ts`, `remember.ts`, `compact.ts`, `try-recall.ts` and
`try-compaction.ts` call a model and cannot run in CI. The two `try-*` files
check `ANTHROPIC_API_KEY` before importing anything that constructs a
`ChatAnthropic` — a static import is hoisted above the check, so the import is
deferred on purpose and the failure is one clear line instead of an SDK
stack trace. Everything else in this directory runs on a clean clone with no
key, no container and no network.
