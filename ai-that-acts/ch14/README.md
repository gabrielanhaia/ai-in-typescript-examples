# ch14 — Ship it Monday: the acting assistant, end to end

Everything the previous thirteen chapters built, in one place, driven by a
single support message from start to finish.

| File | What it does | Needs |
|---|---|---|
| [`config.ts`](config.ts) | Every number owned by a model or a ceiling. Only the first line is a fact. | — |
| [`batch.ts`](batch.ts) | The one file in this chapter that is new: chapter 8's gate and chapter 9's cache, composed. | — |
| [`agent.ts`](agent.ts) | The run, end to end. Chapter 4's thirty lines are still legible inside it. | key + service |
| [`cli.ts`](cli.ts) | A question in, an answer and a transcript out. The chapter default. | key + service |
| [`same-surface.ts`](same-surface.ts) | Both loops, one local server, two requests. Costs nothing and reaches nothing. | — |
| [`no-sampling.test.ts`](no-sampling.test.ts) | The grep that fails the build. In `npm run verify`. | — |
| `system.ts` | **Not from the book.** Chapter 4's five rules plus chapter 8's sentence and chapter 12's clause — the finished artefact the chapter asks you to read. | — |

## Run it

Three commands, in this order, on a box with only Node and Docker on it and
your key already in `.env`:

```bash
docker compose up -d
npm ci
node --env-file-if-exists=.env --import tsx ch14/cli.ts \
  "The rear wheel you built for me turned up buckled. Order ORD-4471.
   What happens now, and can I have my money back?"
```

Only the last one spends anything, and it is also the one that pauses and puts
a question to you. **Type `n` at the first prompt** — the reviewer treats
anything other than `y` as a refusal. The run keeps going, the reply says the
money needs sign-off from somebody else, and the answer still arrives. One
keystroke is the whole proof that the halt is wired into the call path rather
than described in a README.

Then twice more: once with `--trace`, once answering `y`.

**One thing about that third command.** `npx tsx` does not read `.env`, so a
key sitting in a file is not a key the process can see — which is why the
command above is `node --env-file-if-exists=.env --import tsx` and not `npx
tsx`. Plain `--env-file` would be worse than useless on a clone that has no
`.env` yet: Node exits 9 with `node: .env: not found` before your code runs.
The dispatcher does the same thing for both `../.env` and `.env`:

```bash
npm run run-example -- ch14 "…" --trace
```

## The one that costs nothing

```bash
npm run run-example -- ch14/same-surface
```

```text
model       same
max_tokens  same
messages    same
tools       same
system      "You are a support assis…
            [{"type":"text","text":"…
stream      (absent) / false
```

That settles chapter 10's argument in a few lines of output. Both `tools`
arrays match byte for byte: the framework's own conversion path, applied to
the same Zod, lands on the output `z.toJSONSchema` was already producing.

Two rows disagree, and this is the cheapest place to meet either. The
instructions are the same characters in a different wrapper — a plain string
from the hand loop, a single-element array of text blocks from the framework.
And one side adds `stream: false` where the other sends the field at all,
which is the smallest possible version of no longer owning every line of the
request you post.

## The grep

```bash
npm test -- ch14
```

`claude-sonnet-5` returns a 400 for a non-default sampling parameter and the
SDK type-defines all three anyway, so a listing that sets one compiles clean
and fails in production. The type system has been told this parameter is fine.
A grep over your own source, in the test suite, is the only guard available.

The walk starts at the package root, because that is where the listings are:
chapter 14's own tree puts `ch02` … `ch14` at the top level, which is what
makes `from "../ch04/loop.js"` resolve, and there is no `src` to walk. A
second test beside it asserts the walk reaches at least sixty files and
`ch04/loop.ts` among them, because a grep that finds nothing is a grep that
passes, and a guard that can pass vacuously is worse than no guard.

## What the run costs

Nothing is read once. Every iteration re-sends the whole history, internal
reasoning is billed as output and comes out of the same allowance, and only
the opening section of a request can be reused between calls — and only while
it stays byte-identical. `claude-sonnet-5` needs 1,024 tokens before any of it
caches at all; whether seven definitions and a set of instructions get you
there depends on your surface, so measure it.

Look the rates up on the day. One number has an expiry attached: **the
introductory $2/$10 per MTok stops on 2026-08-31**, after which it is $3/$15.
