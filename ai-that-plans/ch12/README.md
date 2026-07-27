# ch12 — When multi-agent is a mistake

Chapter 11 built two working teams. This chapter is the argument for deleting
them, and it is made with two instruments rather than an opinion:

- **`overlap.ts` / `split.ts`** — the free one. Twenty lines that take the tool
  lists of a team and report, for each pair of specialists, what share of the
  smaller list the larger one also holds. No key, no network, same answer on
  every machine. Run this before you spend a request.
- **`measure.ts` / `compare.ts`** — the paid one. The same job run twice, once
  by a single agent with all six tools and a written plan, once by chapter 11's
  supervisor over four specialists, with messages, model calls, input tokens,
  output tokens and wall-clock counted on both sides.

The chapter prints no multiplier, and neither does this directory. The
multiplier is a property of your task set, and the harness is the deliverable.

**The default position is one agent.** `single.ts` is the baseline every team
in this chapter has to beat, and it is the thing most teams never build.

| File | What it does | Needs |
|---|---|---|
| [`single.ts`](single.ts) | The baseline: one `createAgent`, all six tools, and the team's diagram written into the system prompt as six numbered steps. No router, no coordinator. | key |
| [`team.ts`](team.ts) | Chapter 11's supervisor over four specialists, with `outputMode: "last_message"` made explicit — the default, spelled out, because it is where the economics and the correctness collide. | key |
| [`measure.ts`](measure.ts) | `measure(run, tasks)`. Counts four things off the returned message list: messages, `isAIMessage` occurrences, and the `input_tokens` / `output_tokens` LangChain attaches to each `AIMessage` as `usage_metadata`. Plus `ms`. A module — nothing runs it. | — |
| [`compare.ts`](compare.ts) | The runner. Both systems, the same `TASKS`, three ratios out. | key |
| [`overlap.ts`](overlap.ts) | `report(team)`. Of the smaller of two tool sets, the share the larger one also has, for every unordered pair. A module — nothing runs it. | — |
| [`split.ts`](split.ts) | The same report on two objects: the four specialists as the whiteboard drew them, and the same four after a week of "the specialist could not complete its step". | — |
| `tools.ts` | **Not printed.** `export * from "../shop/tools.js"`, plus `workshopTools` — the six tools in one array, which is the name `single.ts` imports. | — |
| `specialists.ts` | **Not printed.** The four `createAgent` calls behind `team.ts`, each with a `name` and a `description`, because the supervisor routes by the one and shows the other to its own model. Tool sets are `AS_DRAWN`'s. | key |
| `tasks.ts` | **Not printed.** `TASKS` — eight realistic Braxby customer messages, the last three deliberately ambiguous. | — |

`single.ts`, `team.ts` and `specialists.ts` build a `ChatAnthropic` at module
scope, so importing any of them without a key throws before a line of your own
code runs. That is `compare.ts`'s failure mode with no key set, and it is the
listing exactly as the book prints it — the credential check belongs in the
runner, not in a listing a reader copies.

## Run it

The free one first. It needs no key, no `.env`, no container and no network:

```bash
npm run run-example -- ch12/split
```

Or directly, without going through npm:

```bash
npx tsx ch12/split.ts
```

Then the one that spends money. Eight tasks, run twice — once through one
agent, once through a supervisor and four specialists:

```bash
npm run run-example -- ch12/compare
```

`measure.ts` and `overlap.ts` are the two printed listings that only export
things. Running either is legal and prints nothing.

## Expected output

### `ch12/split`

Byte-for-byte, on every machine, with no key:

```text
drawn   orders / warranty  0%
drawn   orders / parts  0%
drawn   orders / scheduling  0%
drawn   parts / warranty  0%
drawn   parts / scheduling  0%
drawn   scheduling / warranty  0%
shipped orders / warranty  100%
shipped orders / parts  100%
shipped orders / scheduling  100%
shipped parts / warranty  100%
shipped parts / scheduling  33%
shipped scheduling / warranty  50%
```

Six lines each, because `report` emits each unordered pair once and never a
pair with itself — that is the `if (x >= y) continue`.

The top half is a genuine decomposition: four disjoint tool sets, six zeroes,
a diagram anybody would sign off. The bottom half is the same four agents
after each one was given what it needed to finish its own step, and three of
the four now share a tool with every other agent. `orders` reads 100% against
all three because its tool set is one entry long and every other specialist
acquired that entry — which is the metric working, not a bug in it: a
specialist whose entire surface is a subset of another's is not a specialist.

The gap between those two halves is the whole argument, and it cost nothing to
measure.

No threshold is enforced anywhere in this code, on purpose. Pick one
deliberately and own it: once two specialists share most of the smaller one's
tools, they are the same agent wearing different hats.

### `ch12/compare`

Three lines, in this order, with these labels:

```text
tokens  x…
calls   x…
latency x…
```

Each value is `x` followed by the ratio to two decimal places — team over
single agent — or the literal `n/a` if the single agent's figure was zero.
The numbers themselves are yours and are not printed here or in the book,
because a multiplier from somebody else's task set is worth nothing on yours.
What the arithmetic guarantees before you run it is only the direction:
`calls` is above one by construction, because a supervisor topology adds a
coordinator turn on either side of every handoff.

Three rules for reading the result:

1. **Never one task.** `TASKS` has eight and Book 3's chapter 5 asks for
   twenty. One unlucky route moves a ratio by more than the topology does.
2. **Completed runs only.** Score correctness on the same set first, then
   compare the cost of the runs that actually worked. A team that gives up
   delivers nothing and looks cheap doing it.
3. **Convert to money once, with the date attached.** At `claude-sonnet-5`'s
   introductory rate of \$2 per million input tokens and \$10 per million
   output — introductory pricing that ends on **2026-08-31**, after which the
   rate is \$3 and \$15 — it is one multiplication. Do it: a multiplier of two
   is abstract, and the same multiplier on a month of real traffic is not.

### `ch12/compare` with no key

```text
Error: Anthropic API key not found
```

Thrown from `@langchain/anthropic` while `ch12/single.ts` is still being
imported. Set the key in `../.env` and run it again.

## The two reports to run on your own team

Neither of the objects in `split.ts` is your team, and that is the exercise.

**Replace `AS_DRAWN` and `AS_SHIPPED`.** Put the tool lists from the whiteboard
in one and the tool lists in your repository *this morning* in the other —
with every tool anybody added to make a step finish. The distance between the
two numbers is what that week of fixing actually bought.

**Replace `TASKS`.** Then re-run `compare.ts`, throw away every run that did
not finish, and convert what is left at the rate on the day you ran it.

Do both before anybody opens a diagram tool. They are free, and they settle a
surprising number of arguments before a request is spent.

## A note on `specialists.ts`

The four specialists here carry `AS_DRAWN`'s tool sets — `orders` has
`lookup_order`, `warranty` has `check_warranty`, `parts` has `find_parts` and
`order_part`, `scheduling` has `book_workshop_slot` and `notify_customer`.
That is chapter 11's team carried forward unchanged, so `team.ts` measures the
best version of the split rather than a strawman.

`AS_SHIPPED` is deliberately *not* what this directory runs. It is the object
the chapter contrasts the clean split with, and inventing it here rather than
degrading `specialists.ts` to match keeps the paid comparison honest: the team
is measured at its most defensible, and it still has to beat one agent with a
written-down plan.
