# Book 3 — AI That Acts

*Giving a TypeScript application hands: schemas, executors, and a loop you
wrote yourself.*

Code for **Book 3** of [AI in TypeScript](../README.md) by Gabriel Anhaia.

**What the app becomes here:** the assistant that could quote your documents
can now act — call your API, look up an order, book a slot, and issue a refund
behind a gate that stops and asks a person first.

Every code listing printed in the book exists in this directory and runs. Each
chapter has its own folder with a README stating what each listing does, the
exact command, and the output to expect. The paths are the ones the book
prints — `ch04/loop.ts` is `ch04/loop.ts` — because the book prints imports
like `from "../ch03/toolbox.js"` and those have to resolve.

## Run an example

From **this directory**:

```bash
nvm use                   # Node 24.18.0, from ../.nvmrc
npm ci
npm run run-example -- ch04
```

More shapes of the same command:

```bash
npm run run-example -- --list                 # every listing, and what each needs
npm run run-example -- ch11                   # the MCP pair: no key, no network
npm run run-example -- ch04 "Where is ORD-4471?" --trace
```

`npm run run-example` reads `../.env` and `.env` if either exists, and is the
one place credentials and the sample service are checked — the listings
themselves are exactly as printed in the book.

## What you need, and when

**Nothing at all** for chapters 3, 5, 7, 8, 9, 11, 12 and 13, and for the
keyless half of 2, 4, 6, 10 and 14. `npm run run-example -- --list` prints
what each listing needs, by name. The two to run first are `ch11`, which
spawns its own MCP server as a child process and never reaches the network,
and `ch14/same-surface`, which settles chapter 10's central claim against a
server on `127.0.0.1` for nothing.

**The sample service** from chapter 6 onward:

```bash
docker compose up -d          # the Braxby service and its database
```

or, on your own Node, in a second terminal, `npm run app`. It is one service
and its database is a SQLite file, because Node 24 ships a SQLite driver;
there is no account, no licence key, and no second container. See
[`app/`](app).

**One key.** There is a single provider here, and everything else the tools
reach is the sample service in this directory:

| Variable | What it is | Chapters |
|---|---|---|
| `ANTHROPIC_API_KEY` | the model, `claude-sonnet-5` | 2, 4, 9, 10, 13, 14 |
| `BRAXBY_API_URL` | where the sample service is answering. Optional — it falls back to `http://localhost:8788` | 6 onward |

Book 2 needed four entries, since embedding, reranking and answering were
three separate suppliers. This file has two names in it and no values behind
either.

## Chapters

| | Directory | What it covers |
|---|---|---|
| 2 | [`ch02`](ch02) | One tool, one round trip, every block printed |
| 3 | [`ch03`](ch03) | One Zod schema, three consumers, one door |
| 4 | [`ch04`](ch04) | The agent loop, by hand, and four ways to break it |
| 5 | [`ch05`](ch05) | What goes on the surface, and what a bad one costs |
| 6 | [`ch06`](ch06) | Deadlines, identity by closure, and what to hand back |
| 7 | [`ch07`](ch07) | Three classes of failure, and the write that happens twice |
| 8 | [`ch08`](ch08) | The reversibility ladder, the gate, and the dry-run |
| 9 | [`ch09`](ch09) | Three ceilings, a signal, and a stall detector |
| 10 | [`ch10`](ch10) | The same loop, with the framework, and the row it leaves empty |
| 11 | [`ch11`](ch11) | An MCP client and one small MCP server |
| 12 | [`ch12`](ch12) | Retrieval demoted to one tool among seven |
| 13 | [`ch13`](ch13) | The weekly report, written both ways |
| 14 | [`ch14`](ch14) | The whole application, and the claim chapter 10 made |

Chapter 1 has no code in it, which is why there is no `ch01`.

Two directories are not chapters. [`app/`](app) is the Braxby Cycles service
the tools call. [`retrieval/`](retrieval) is Book 2's pipeline shipped as a
fixture, so chapter 12 can hand retrieval to the loop without asking you to
stand up a vector store first.

## Verify it

```bash
npm ci
npm run typecheck     # tsc --noEmit, zero errors over 110 files
npm run verify        # typecheck + the unit tests
```

**`npm run verify` never calls a provider, never touches the service, and
never needs a key.** It collects exactly **four test files and seven tests**:

| File | Tests |
|---|---|
| `ch03/toolbox.test.ts` | 3 — a valid call, a schema rejection, an unknown tool |
| `ch12/cited.test.ts` | 1 — an invented label is reported, not dropped |
| `ch13/weekly-report.test.ts` | 1 — the boundary at exactly the threshold |
| `ch14/no-sampling.test.ts` | 2 — the grep, and that the grep walks something |

If that count changes without a listing being added, something has leaked.
`vitest.config.ts` lists every test file by **exact path** and throws at config
load if the tree and the list disagree — Book 1 used a glob here, the directory
it named was renamed, and a test that spends money leaked into the suite that
is not supposed to spend anything.

The one suite that needs infrastructure is chapter 6's two tool tests, which
need the service and still no key:

```bash
docker compose up -d
npm run test:live     # 1 file, 2 tests
```

## `npm ls`, read honestly

Run it once and read what it says. Three of the pins — `@anthropic-ai/sdk`,
`zod` and `hono` — appear exactly once each, which is what the pinned-versions
table assumes. `@hono/node-server` does not:

```text
├── @hono/node-server@2.0.11
    └── @hono/node-server@1.19.15   (under @modelcontextprotocol/sdk)
```

The protocol SDK declares a caret on the 1.x line, which no 2.x release
satisfies, so both are installed. Each is right for the package that asked for
it, they serve different code paths, and nothing here is broken. **Leave it
alone** — an `overrides` entry would push an untested major version through
somebody else's declared range purely to tidy up a line of output.

`npm ci` prints no deprecation warning.

**`@langchain/langgraph` is absent from `package.json`** and that is the
boundary drawn as a dependency rather than as a paragraph. The framework
installs it anyway, one level down, so the code that needs it is present and
no one here has to keep a pin for it.

## Versions

Everything is pinned to an exact version. What is pinned, why, and when it was
last verified: [`../docs/versions.md`](../docs/versions.md). If something
breaks, check [`../docs/troubleshooting.md`](../docs/troubleshooting.md) first.

Three pins are load-bearing enough to repeat here:

- **`skipLibCheck: true` is required here.** Drop it and compilation halts on
  a declaration shipped inside `@langchain/anthropic@1.5.2` that names a type
  `@anthropic-ai/sdk@0.115.0` has since renamed. It is internal to those two
  packages, changes nothing at run time, and reproduces on a fresh install.
- **`@types/node` is `24.13.3`**, not `latest`, which is Node 26 typings
  against a Node 24 LTS runtime.
- **`@modelcontextprotocol/sdk` is the fastest-moving pin here.** The revision
  chapter 11 negotiates is read from the installed package's own
  `LATEST_PROTOCOL_VERSION`, which `ch11/round-trip.ts` prints.

You do **not** need to have run Book 1's or Book 2's examples. Each book's
directory is a self-contained snapshot of the app at that rung.

## The one guard the compiler cannot give you

Set any of the three sampling knobs to a non-default value on
`claude-sonnet-5` and the API answers 400. Both the SDK types and the
framework's `ChatAnthropic` options still accept them, so such a line
**builds, reads fine in review, and only fails against the real endpoint**.
No compiler setting closes the gap. `ch14/no-sampling.test.ts` scans this
directory's own files instead and stops the build, and it runs inside
`npm run verify`.

## Where this repo differs from the printed page

Small, deliberate, and listed here so nothing is a surprise.

- **One manifest, not one per chapter**, with the same exact pins.
- **Directories are named after the chapter**, exactly as the book prints them,
  so `../ch03/toolbox.js` resolves.
- **`ch14/no-sampling.test.ts` walks the package root, not `"src"`.** The
  chapter's listing says `sources("src")`; there is no `src` here, because
  chapter 14's own tree puts `ch02` … `ch14` at the top level. A second test
  beside it asserts the walk reaches something, because a grep that finds
  nothing passes.
- **Chapter 6's toolbox has all six tools on it.** The chapter prints one;
  chapter 5's table settles the surface at six and chapter 12 says it goes
  from six to seven, so the other five are written here in the shape of the
  printed one. `toolboxFor` takes an optional run id, because
  `bookSlot(ctx, runId)` needs one and the printed signature has nowhere to
  get it.
- **`ch09/conclude.ts` takes the system prompt as an argument.** The chapter
  prints the call and not the signature; chapter 14's finished prompt is
  chapter 4's plus two additions, and the concluding call has to carry the
  same one the run did.
- **`ch10/hitl.ts` is not wired into anything**, and the `new Command({ resume:
  … })` block beside it in the chapter has no file at all. Both need a
  checkpointer, the checkpointer is in `@langchain/langgraph`, and that package
  is deliberately not a dependency. The chapter says so.
- **`ch13/report-agent.ts` runs against the surface this application has.** The
  chapter tables four tools for it, two of which do not exist here and one of
  which — `send_email` — is at the top of chapter 8's ladder.
- **Nine files are not listings from the book.** Every one says so on its first
  line: the seven `chNN/run-examples.ts` drivers and `ch11/round-trip.ts`, so
  that chapters made entirely of exports have something to run, plus
  `ch09/agent.ts`, the chapter-9 loop the book describes and never prints
  because chapter 14 does. `ch10/system.ts`, `ch14/system.ts` and
  `ch14/cli.ts` are named in the book's own file tree but not printed.
- **`app/` and `retrieval/` are the book's, by name, and not printed.** Two
  route handlers inside `app/` are printed verbatim and are marked as such in
  the file. See [`app/README.md`](app/README.md) and
  [`retrieval/README.md`](retrieval/README.md).
