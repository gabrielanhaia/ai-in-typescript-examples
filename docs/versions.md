# Versions

Every dependency in this repo is pinned to an **exact** version. No `^`, no `~`, no `latest`.

This file is the record of what is pinned, why it is pinned there, and when it was last verified against the real world. It is the reason a reader who picks up a book six months after publication can still run the code.

## The rule

1. **Exact pins only.** A range makes the repo unreproducible and turns a reader's first five minutes into a debugging session.
2. **Every pin has a reason and a date.** "Latest at the time" is a valid reason; an undated pin is not.
3. **Verified twice per book** — once while the book is drafted, once at its fact-check pass — and re-verified whenever CI reports a break.
4. **A pin is only changed deliberately**, with the change noted in the changelog below. Silent bumps are how a repo stops matching the printed book.

## Pinned versions

| Package | Pinned | Why | Last verified | Used by |
|---|---|---|---|---|
| `langchain` | `1.5.4` | The framework the series teaches. Exports the message classes and `initChatModel`, the provider seam in ch. 14. Moves in lockstep with `@langchain/anthropic` — bump both together or not at all. | 2026-07-25 | `ai-that-answers` |
| `@langchain/anthropic` | `1.5.2` | The provider binding. **1.5.2 specifically**: `1.5.1` depended on `@anthropic-ai/sdk ^0.103.0`, which resolves to a *second, nested* copy of the SDK; `1.5.2` moved to `^0.115.0` and the tree deduplicates to one. Verify with `npm ls @anthropic-ai/sdk` after any bump. | 2026-07-25 | `ai-that-answers` |
| `@langchain/core` | `1.2.3` | Peer of both packages above. The 2026-07-24 release wave raised the floor from `^1.2.1` to `^1.2.3`, so this pin sits **exactly on the floor** — any future bump to `langchain` or `@langchain/anthropic` must re-check this peer before it moves. | 2026-07-25 | `ai-that-answers` |
| `@anthropic-ai/sdk` | `0.115.0` | A top-level dependency from ch. 10 onward, not a chapter-1 cameo. The framework's `getNumTokens` silently returns `Math.ceil(text.length / 4)` for these models, so `client.messages.countTokens` is the only usable counter — and `APIError`/`APIConnectionError` are ch. 12's taxonomy. | 2026-07-25 | `ai-that-answers` |
| `zod` | `4.4.3` | Schema + inferred type in one declaration, ch. 9. v4 is required for `z.toJSONSchema`, which `print-json-schema.ts` uses to show what the provider actually receives. | 2026-07-25 | `ai-that-answers` |
| `hono` | `4.12.32` | The HTTP layer, ch. 8 and ch. 14. Chosen over Express because it was the only candidate actually version-verified for the series, and `hono/streaming`'s `streamSSE` is the whole of the SSE route. | 2026-07-25 | `ai-that-answers` |
| `@hono/node-server` | `2.0.11` | **Hono has no Node listener of its own**, so the ch. 8 server cannot run without this. Peer is `hono ^4`; pin the two together, always. Found by starting the server, not by reading docs. | 2026-07-25 | `ai-that-answers` |
| `typescript` | `7.0.2` | Current stable (released 2026-07-08). Documented fallback **5.9.3**, with **6.0.3** as the intermediate option — 6.0 carries its own breaking changes (import assertions deprecated, generic JSX inference), so falling back into 6.x trades one migration for another. | 2026-07-25 | `ai-that-answers` |
| `@types/node` | `24.13.3` | **Never `latest`.** `latest` is `26.x` — Node 26 typings — which contradicts the Node 24 LTS runtime pin below and produces type errors that look like code bugs. | 2026-07-25 | `ai-that-answers` |
| `tsx` | `4.23.1` | Runs the `.ts` listings directly, so no build step stands between a reader and an example. Loaded with `node --import tsx`. | 2026-07-25 | `ai-that-answers` |
| `vitest` | `4.1.10` | The unit tests. `npm run verify` runs them and they never touch the network; the one test that calls the model is in `npm run test:live`. | 2026-07-25 | `ai-that-answers` |

## Runtime

| Component | Pinned | Why | Last verified |
|---|---|---|---|
| Node.js | **24.18.0** ("Krypton", Active LTS) | Recorded in [`.nvmrc`](../.nvmrc) at the repo root, which is what CI reads (`node-version-file: .nvmrc`) and what `nvm use` picks up. Matches the `@types/node` pin. | 2026-07-25 |
| Base image | `node:24-bookworm-slim` | The 24.x line, Debian bookworm, slim. Each book's `Dockerfile` uses it; the exact patch a build resolves to is whatever the tag points at on build day. | 2026-07-25 |
| TypeScript config | `strict`, `module: nodenext`, **`skipLibCheck: true`** | `skipLibCheck` is **required, not a preference**: without it `tsc` fails inside `@langchain/anthropic@1.5.2`'s own `webSearch.d.ts`, which references `BetaWebSearchTool20250305` — a type `@anthropic-ai/sdk@0.115.0` renamed to `BetaWebSearchTool20260209`. Library-internal, reproducible, no runtime effect. | 2026-07-25 |

## Model

| | Pinned | Why | Last verified |
|---|---|---|---|
| Example model | `claude-haiku-4-5` | Book 1's subject *is* cost and a beginner runs a script dozens of times, so the cheapest tier is the honest default. It is also the only tier that accepts `temperature`/`top_p`/`top_k`, which is what makes chapter 5 teachable at all. From Book 2 the running app moves to `claude-sonnet-5`. | 2026-07-25 |
| Rates used in the code | `ch11-cost-you-can-compute/rates.ts` | The rate table carries its own `VERIFIED_ON` constant, so a cost printed by this repo always names the date its constants were checked. Chapter 14's log line prints that date beside every figure. | 2026-07-25 |

## Scheduled verification

`.github/workflows/verify.yml` runs on a schedule and on demand. For every book directory that has a `package.json`, it:

- installs and runs the examples **against the pinned versions** — this must always pass, and a failure means the repo is broken for readers today;
- installs and runs them **against latest** — this is allowed to fail, and when it does the workflow opens an issue naming the package and the error.

Both jobs run `npm run typecheck` and `npm run verify`. **Neither uses an API key**, by design: a scheduled job that spends money is a job someone eventually turns off. What CI can catch without a key is every kind of breakage a version bump causes — a renamed export, a changed type, a moved entry point. What it cannot catch is the provider changing its mind about a parameter; that is chapter 5's live probe, `npm run test:live`, and it is run deliberately.

That second job is the early-warning system for framework churn. When it fires: fix the repo immediately, record the new pin here with today's date, and note it for the book's next edition.

## Changelog

Changes to a pin go here, newest first — date, what moved, from what to what, and why.

- **2026-07-25 — first published set.** Every pin above landed with *AI That Answers*, verified by installing the tree and running `npm ci && npm run typecheck && npm run verify` on it. Two of them were arrived at the hard way and are worth restating: `@langchain/anthropic` is `1.5.2` rather than `1.5.1` because `1.5.1` produces a duplicated `@anthropic-ai/sdk`, and `@types/node` is `24.13.3` rather than `latest` because `latest` is Node 26 typings against a Node 24 runtime.
