# AI in TypeScript — Examples

Runnable, CI-verified code examples for **AI in TypeScript**, a five-book series by Gabriel Anhaia.

Every code listing printed in the books exists here, pinned to exact versions and verified on a schedule. The books explain *why*; this repo is *what you run*.

> **Status: Book 1's examples are here.** [`ai-that-answers/`](ai-that-answers) holds every listing printed in *AI That Answers*, across all fourteen chapters, pinned and CI-verified. The other four directories fill in as their books are drafted.

## The series

| # | Book | This directory | What the app becomes |
|---|---|---|---|
| 1 | **AI That Answers** | [`ai-that-answers/`](ai-that-answers) | a chatbot that works, streams, returns typed output, and whose cost you can predict |
| 2 | **AI That Reads** | [`ai-that-reads/`](ai-that-reads) | …that answers from **your documents**, with citations |
| 3 | **AI That Acts** | [`ai-that-acts/`](ai-that-acts) | …that can **act** — call your APIs and functions |
| 4 | **AI That Plans** | [`ai-that-plans/`](ai-that-plans) | …that **plans, remembers, and delegates** |
| 5 | **AI That Ships** | [`ai-that-ships/`](ai-that-ships) | …that is **measured, guarded, and deployed** |

Each directory is a self-contained snapshot of the app at that rung. **You can start at any book** — you do not need to have run the previous one.

## Quickstart

```bash
git clone https://github.com/gabrielanhaia/ai-in-typescript-examples.git
cd ai-in-typescript-examples
cp .env.example .env      # then put your API key in it
```

Each example runs in a single command, with no local Node or TypeScript setup:

```bash
docker compose run ai-that-answers ch03                 # a chapter
docker compose run ai-that-answers --list               # every listing
docker compose run ai-that-answers ch07/stream-cancel   # a named listing
docker compose run --service-ports ai-that-answers ch08 # anything serving HTTP
```

Each chapter folder carries its own README: the file list, the command, and what the run should print.

**Two chapters run with no API key at all** and print the same output on every machine — `ch11` (the cost arithmetic) and `ch13` (the functions that should never be a model call). They are the two to try first.

Prefer your own toolchain? `.nvmrc` pins the Node version:

```bash
cd ai-that-answers
nvm use && npm ci
npm run run-example -- ch03
```

## Versions

Everything is pinned to an **exact** version — no `^`, no `~`, no `latest`. What is pinned, why, and when it was last verified lives in [`docs/versions.md`](docs/versions.md).

A scheduled workflow runs every example against **both** the pinned versions and the latest releases. When latest breaks, it opens an issue here — the fix lands in this repo immediately, and in the book at its next edition. If something breaks for you, check [`docs/troubleshooting.md`](docs/troubleshooting.md) first; the answer is usually already there.

## Your API key

Examples read `process.env.ANTHROPIC_API_KEY` and fail with a clear message when it is missing. Copy `.env.example` to `.env` and put your key there. **Never commit `.env`** — it is git-ignored, and no key ever appears in this repo, in a code block, or in recorded output. A CI job fails the build if one ever does.

Examples default to a fast, inexpensive model and small token budgets. Each book's README says which of its examples make more than one call, and points at the rate table — with its verification date — rather than printing a total that was never measured on your account.

**Nothing in CI spends money.** `npm run verify` is typechecks and unit tests only; the one test in Book 1 that calls the model is run deliberately with `npm run test:live`.

## License

Code: [MIT](LICENSE) — use it in your own projects freely.

The books themselves are separate, copyrighted works and no manuscript text appears in this repo.
