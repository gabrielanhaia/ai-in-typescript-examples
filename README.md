# AI in TypeScript — Examples

Runnable, CI-verified code examples for **AI in TypeScript**, a five-book series by Gabriel Anhaia.

Every code listing printed in the books exists here, pinned to exact versions and verified on a schedule. The books explain *why*; this repo is *what you run*.

> **Status: scaffold.** The books are being written. Each directory below fills in as its book is drafted, starting with *AI That Answers*. Watch or star the repo if you want the first examples when they land.

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

Once a book's examples are published, each one runs in a single command with no local Node or TypeScript setup:

```bash
docker compose run ai-that-answers ch03
```

Every example directory has a README stating what it does, the exact command, and the output you should expect.

*(`docker-compose.yml` lands with the first published example, so this repo never ships a compose file that references a Dockerfile that isn't here yet.)*

## Versions

Everything is pinned to an **exact** version — no `^`, no `~`, no `latest`. What is pinned, why, and when it was last verified lives in [`docs/versions.md`](docs/versions.md).

A scheduled workflow runs every example against **both** the pinned versions and the latest releases. When latest breaks, it opens an issue here — the fix lands in this repo immediately, and in the book at its next edition. If something breaks for you, check [`docs/troubleshooting.md`](docs/troubleshooting.md) first; the answer is usually already there.

## Your API key

Examples read `process.env.ANTHROPIC_API_KEY` and fail with a clear message when it is missing. Copy `.env.example` to `.env` and put your key there. **Never commit `.env`** — it is git-ignored, and no key ever appears in this repo, in a code block, or in recorded output.

Examples default to a fast, inexpensive model and small token budgets. Each book's README states what running its full set costs, with the date that figure was checked.

## License

Code: [MIT](LICENSE) — use it in your own projects freely.

The books themselves are separate, copyrighted works and no manuscript text appears in this repo.
