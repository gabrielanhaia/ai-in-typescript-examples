# Book 1 — AI That Answers

*Your First LLM App in TypeScript: Prompts, Structured Output, and What Every Token Costs*

Code for **Book 1** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** a chatbot that works, streams, returns typed
structured output, and whose cost you can predict.

Every code listing printed in the book exists in this directory and runs. Each
chapter has its own folder with a README stating what each listing does, the
exact command, and the output to expect.

## Run an example

From the **repository root**, with no local Node or TypeScript setup:

```bash
cp .env.example .env      # then put your API key in it
docker compose run ai-that-answers ch03
```

More shapes of the same command:

```bash
docker compose run ai-that-answers --list                  # every listing
docker compose run ai-that-answers ch07/stream-cancel      # a named listing
docker compose run ai-that-answers ch02 "your question"    # with arguments
docker compose run --service-ports ai-that-answers ch08    # anything serving HTTP
```

If you would rather use your own toolchain, from **this directory**:

```bash
nvm use                   # Node 24.18.0, from ../.nvmrc
npm ci
npm run run-example -- ch03
```

`npm run run-example` reads `../.env` and `.env` if either exists, and is the one
place the API key is checked — the listings themselves are exactly as printed in
the book.

## Chapters

| | Directory | What it covers |
|---|---|---|
| 1 | [`ch01-what-an-llm-call-actually-is`](ch01-what-an-llm-call-actually-is) | The same call through the SDK and through the framework |
| 2 | [`ch02-your-first-call-in-one-file`](ch02-your-first-call-in-one-file) | The smallest project that makes a real call |
| 3 | [`ch03-messages-roles-and-history`](ch03-messages-roles-and-history) | The chat loop, and what it resends every turn |
| 4 | [`ch04-the-system-prompt`](ch04-the-system-prompt) | Whole prompts, kept byte-stable, in their own module |
| 5 | [`ch05-sampling`](ch05-sampling) | `temperature` — what it buys, and where it went |
| 6 | [`ch06-prompt-technique`](ch06-prompt-technique) | A tally sheet instead of an opinion |
| 7 | [`ch07-streaming-to-a-terminal`](ch07-streaming-to-a-terminal) | `.stream()`, chunk assembly, cancellation |
| 8 | [`ch08-streaming-to-a-web-ui`](ch08-streaming-to-a-web-ui) | Hono, SSE, and a browser that renders as it lands |
| 9 | [`ch09-structured-output-with-zod`](ch09-structured-output-with-zod) | One schema, a validator and a type |
| 10 | [`ch10-tokens-and-the-context-window`](ch10-tokens-and-the-context-window) | Counting properly, and the two ceilings |
| 11 | [`ch11-cost-you-can-compute`](ch11-cost-you-can-compute) | Rates, arithmetic, caching, and five levers |
| 12 | [`ch12-errors-retries-timeouts`](ch12-errors-retries-timeouts) | Classify before you retry; choose your own policy |
| 13 | [`ch13-when-not-to-use-an-llm`](ch13-when-not-to-use-an-llm) | Six functions that should never be a model call |
| 14 | [`ch14-the-finished-chatbot`](ch14-the-finished-chatbot) | All of it, assembled, with the seam in one file |

Chapters **11** and **13** run with no API key at all, and their output is
identical on every machine. They are the two to try first.

## What it costs to run

The model throughout is **`claude-haiku-4-5`**, the cheapest tier, because the
book's subject is cost and a beginner runs a script dozens of times. Most
listings are one call with a small `maxTokens`. The two that are not:

- **ch06** makes **132 calls** (22 inputs × 3 runs × 2 variants) — the most expensive example in the book.
- **ch05** makes **20 calls**, and ch10's `size-cap.ts` makes 22.

Token counting (`messages.countTokens`) generates nothing and is not billed, so
most of chapter 10 is free.

**No dollar total is printed here**, because it would be a figure nobody measured
on your account, and this repo does not print numbers it did not measure. What it
gives you instead is the arithmetic: the rate table lives in
[`ch11-cost-you-can-compute/rates.ts`](ch11-cost-you-can-compute/rates.ts) with
the date it was verified beside it, and `docker compose run ai-that-answers ch11`
prints the cost of a call and of a whole conversation. That is chapter 11's whole
point, and it is worth running before you run anything that loops.

## Verify it

```bash
npm ci
npm run typecheck     # tsc --noEmit, zero errors
npm run verify        # typecheck + the unit tests
```

**`npm run verify` never calls the provider and never needs a key.** The one test
in the book that does — chapter 5's model probe — lives in `npm run test:live`
and is run deliberately.

## Versions

Everything is pinned to an exact version. [`tsconfig.json`](tsconfig.json) is the
one the book prints in chapter 2; [`package.json`](package.json) carries those
same exact pins plus the packages later chapters add — `@anthropic-ai/sdk` from
chapter 10, `zod` from chapter 9, `hono` and `@hono/node-server` from chapter 8,
`vitest` from chapter 5. One manifest serves all fourteen chapters. What is
pinned, why, and when it was last verified:
[`../docs/versions.md`](../docs/versions.md). If something breaks, check
[`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.

Two pins are load-bearing enough to repeat here:

- **`skipLibCheck: true`** is required. Without it `tsc` fails inside
  `@langchain/anthropic@1.5.2`'s own `webSearch.d.ts`, which references a type
  `@anthropic-ai/sdk@0.115.0` renamed. Library-internal, no runtime effect.
- **`@types/node` is pinned to 24.13.3**, not `latest`. `latest` is Node 26
  typings, which contradicts the Node 24 LTS runtime pin.

You do **not** need to have run the previous book's examples — there is no
previous book, and from Book 2 onward each directory stays a self-contained
snapshot of the app at that rung.

## Where this repo differs from the printed page

Small, deliberate, and listed here so nothing is a surprise.

- **One manifest, not one per chapter.** The book's chapter 2 stands up a project
  with its own `package.json`, and later chapters add to it. Fourteen manifests
  would be fourteen dependency trees to drift apart, so this directory has one,
  with the same exact pins. Where the book says `npm run ask -- "…"`, this repo
  says `npm run run-example -- ch02 "…"`.
- **Directories are named after the chapter**, so `ch02` in the book is
  `ch02-your-first-call-in-one-file` here. The runner accepts the short form:
  `docker compose run ai-that-answers ch02`.
- **File paths resolve against the module, not the working directory.** Where a
  listing prints `readFile("ch08/index.html")`, this repo uses
  `readFile(new URL("index.html", import.meta.url))` so the example runs from
  wherever you started it. One token different, same behaviour.
- **Chapter 7's `stopReason` takes `AIMessage | AIMessageChunk`.** Chapter 12
  reuses it on a buffered response and tells you to widen the parameter first;
  the shipped file is already widened, because there is only one of it.
- **Two files are not listings from the book.**
  `ch11-cost-you-can-compute/run-examples.ts` and
  `ch13-when-not-to-use-an-llm/run-examples.ts` are drivers, so that chapters
  made entirely of pure functions have something to run and an output to show.
  Both say so at the top.
- **Chapter 6's input set is larger than the twelve printed**, which is what the
  chapter says you will find here. The printed twelve come first, verbatim.
