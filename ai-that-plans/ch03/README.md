# ch03 — State is the design: channels and reducers

Chapter 2's placeholder state, replaced with five channels that each answer a
question: what merges, what replaces, what is written once, what is never
saved at all. The nodes barely change. The behaviour does, because the
behaviour is not in the nodes — a node produces a write, and the channel
decides what that write means.

**Nothing in this directory calls a model.** Every file here runs on a clean
clone with no `ANTHROPIC_API_KEY`, no `.env`, and no Docker, and prints the
same thing on every machine. That is not a convenience; it is the argument.
A state declaration is machinery, and machinery can be watched directly.

| File | What it does | Needs |
|---|---|---|
| [`plan-channel.ts`](plan-channel.ts) | `PlanOnce`, the write-once plan channel, and the `Step` schema behind it. The first non-empty write wins and every later one is dropped. | — |
| [`state.ts`](state.ts) | The five channels, four merge behaviours. Exports `PlanState` and the `State` / `Update` aliases every node in this book is written against. | — |
| [`nodes.ts`](nodes.ts) | `advance` and `record`, typed with `typeof PlanState.Node` because they live outside the builder. `record` returns one key and never re-implements the merge. | — |
| [`collide.ts`](collide.ts) | Eleven lines that throw. Two nodes, one superstep, one last-value channel. | — |
| [`reset.ts`](reset.ts) | `startOver`, which wraps its write in `Overwrite` to empty an accumulating channel. | — |
| [`narrow.ts`](narrow.ts) | `PlannerInput`. The planner is handed two channels and cannot read a third. Channels reused by reference from `PlanState.fields`. | — |
| [`older-forms.ts`](older-forms.ts) | `Annotation.Root` and the Zod-object-plus-registry form, side by side, so you can recognise both. Compiles; nothing runs it. | — |
| [`shop.ts`](shop.ts) | **Not printed.** One line, so `from "./shop.js"` resolves in this directory as it does in every other. | — |
| [`supersteps.ts`](supersteps.ts) | **Not printed.** The chapter default. The three ticks the chapter describes and diagrams but never prints: `planner`, then `lookup_order`, then `check_warranty`. | — |
| [`walk.ts`](walk.ts) | **Not printed.** Drives `nodes.ts` and `reset.ts` so the two listings that only export functions have something to be seen doing. | — |
| [`duplicate.ts`](duplicate.ts) | **Not printed.** The seven-entries-not-three failure whose *output* the chapter prints but whose code it does not. | — |
| [`collide-quiet.ts`](collide-quiet.ts) | **Not printed.** The first experiment's second half: the same collision with a last-write-wins reducer, run ten times. | — |
| [`name-clash.ts`](name-clash.ts) | **Not printed.** The second experiment: a channel and a node fighting over the name `planner`. | — |

## Run it

```bash
npm run run-example -- ch03                 # the default: ch03/supersteps
npm run run-example -- ch03/supersteps
npm run run-example -- ch03/walk
npm run run-example -- ch03/collide         # throws, on purpose, exit 1
npm run run-example -- ch03/collide-quiet
npm run run-example -- ch03/duplicate
npm run run-example -- ch03/name-clash
```

Or directly, without going through npm — no `--env-file` needed, because
nothing here reads the environment:

```bash
npx tsx ch03/supersteps.ts
```

`plan-channel.ts`, `state.ts`, `nodes.ts`, `reset.ts`, `narrow.ts` and
`older-forms.ts` are the printed listings that only export things. Running one
is legal and prints nothing:

```bash
npx tsx ch03/state.ts     # no output, exit 0
```

They are covered by `npm run typecheck`, which is where a state declaration
gets most of its testing anyway.

## Expected output

### `supersteps.ts` — the default

One line per superstep, plus the input state the run started from:

```text
input            messages=1  plan=0  cursor=0  results=[]
planner          messages=2  plan=6  cursor=0  results=[]
lookup_order     messages=2  plan=6  cursor=1  results=[lookup_order]
check_warranty   messages=2  plan=6  cursor=2  results=[lookup_order, check_warranty]

plan was written once and never moved; cursor changed by one each tick; results only grew.
```

Read the columns rather than the rows. `plan` goes 0 → 6 and stops. `cursor`
moves by exactly one per tick. `results` only ever grows. `messages` goes up
by one and then holds, because only `planner` writes it. A state where every
column changed on every row would be one blob under four names.

`signal` never appears, because nothing wrote it and an empty channel is
simply absent from the object a node receives — which is why `planner` reads
it through a guard.

### `walk.ts`

```text
step 1    cursor=1  results={lookup_order}
step 2    cursor=2  results={lookup_order, check_warranty}
step 3    cursor=3  results={lookup_order, check_warranty, find_parts}
startOver cursor=0  results={}
```

The first three lines are `record` and `advance` from the printed
`nodes.ts`. `record` returns a single key every time and never reads
`state.results` — and the results accumulate anyway, because the channel owns
the merge. The last line is `startOver` from `reset.ts`: the same channel,
emptied in one step, because `Overwrite` bypasses the reducer.

### `collide.ts` — throws, exit code 1

```text
InvalidUpdateError: Invalid update for channel "cursor" with values [1,2]: LastValue can only receive one value per step.

Troubleshooting URL: https://docs.langchain.com/oss/javascript/langgraph/INVALID_CONCURRENT_GRAPH_UPDATE/
```

followed by a stack trace and, at the bottom of it,
`lc_error_code: 'INVALID_CONCURRENT_GRAPH_UPDATE'`. That is the message the
chapter quotes, wrapped: it names the channel, prints both values, and states
the rule it enforced. If you are catching it, catch `InvalidUpdateError` —
it is exported from `@langchain/langgraph`.

### `collide-quiet.ts` — the same collision, with a reducer

```text
cursor over ten runs: 2 2 2 2 2 2 2 2 2 2
Stable on this machine. That is the failure, not the absence of one.
```

Ten runs, one answer, no error. This is the point of the experiment and it is
easy to misread as a success. The two nodes are trivial and the scheduler runs
them in the order they were added, so `right` always wins here. Put a supplier
API in each branch and the winner becomes whichever one answered second.

### `duplicate.ts` — seven entries, not three

```text
returns the total: 7 entries
  lookup_order, lookup_order, check_warranty, lookup_order, lookup_order, check_warranty, find_parts
returns the delta: 3 entries
  lookup_order, check_warranty, find_parts
```

The first list is the one the chapter prints. Same channel, same three steps,
same reducer — the only difference is that the first node returns
`[...state.completed, step]` and the second returns `[step]`. On an appending
channel a node returns only what it added; the channel keeps the total.

### `name-clash.ts`

```text
planner is already being used as a state attribute (a.k.a. a channel), cannot also be used as a node name.
```

Thrown by `addNode`, before `compile()` and before anything runs. It is why
this chapter's plan-producing node is called `planner` and not `plan`.

## The other experiments

Two of the chapter's five are edits to your own files rather than files here,
because the whole point of them is watching the compiler or the runtime
respond to *your* change.

**Make `plan` append instead of write once.** In `plan-channel.ts`, replace
the `PlanOnce` reducer with `(current, next) => [...current, ...next]`, then
add a second node to `supersteps.ts` that also writes `plan`. Print
`state.plan.length` each tick. The list grows, and every node that reads
`plan[0]` keeps confidently reading the first plan while the graph is doing
something else.

**Delete a field and see who notices.** Remove the `cursor` line from
`state.ts` and run `npm run typecheck`. `nodes.ts`, `supersteps.ts` and
`walk.ts` all fail, each at the line that *read* it. That is the payoff for
declaring state in one typed place — and the shape of the payoff is worth
noticing: `reset.ts` keeps compiling, because it only ever *writes* `cursor`,
and an update is a partial object whose extra key nobody checks. Reads are
caught, stray writes are not.

Put both files back before you go on.

## Where this differs from the page

**The chapter names no default listing; `supersteps.ts` is this directory's
choice.** The chapter's own runnable instruction is
`npm run run-example -- ch03/collide`, which throws by design and so makes a
poor default. `supersteps.ts` is the run behind the chapter's second diagram —
the state after each of three ticks — which the chapter describes in prose and
draws, but never prints as code.

**The `InvalidUpdateError` is longer than the page shows.** The chapter prints
the two lines that matter. The shipped 1.4.8 error adds a blank line and a
troubleshooting URL, and Node prints a stack trace under it. The quoted text
is exact, character for character, up to the line wrap the page needed.

**`narrow.ts` needs a message to read.** `state.messages[0].text` throws on an
empty transcript, so the builder it exports has to be invoked with at least
one message: `builder.addEdge(START, "planner").addEdge("planner", END)`,
then `invoke({ messages: [new HumanMessage("…")] })`. The listing is
reproduced exactly as printed; the guard the chapter leaves out is the
caller's job.

**`older-forms.ts` is imported by nothing.** It exists to be compiled and
read, and it compiles — both older forms still work in 1.4.8.

The chapter's advice to grep `node_modules` for `@deprecated` rather than
trust a blog post is worth doing once on this file, because all three
deprecations it names are checkable in about a minute:

```bash
grep -rn "@deprecated" -A 2 node_modules/@langchain/langgraph/dist/graph/annotation.d.ts
grep -rn "@deprecated" -A 2 node_modules/@langchain/langgraph/dist/graph/zod/plugin.d.ts
grep -rn "@deprecated" -A 2 node_modules/@langchain/langgraph/dist/graph/types.d.ts
```

They say, in order: `Use \`reducer\` instead` (the `value` field on an
annotation); `Using the langgraph zod plugin is deprecated … Consider
upgrading to zod 4 and using the exported langgraph meta registry.
{@link langgraphRegistry}`; and `Use \`state\` instead` (the `stateSchema`
key on the graph init object). The second is the five-minute detour the
chapter warns about — the notice says `langgraphRegistry`, the symbol you
import is `registry`.

Note what is *not* deprecated: `Annotation.Root`, and Zod state itself. The
deprecation is on the plugin — the `.langgraph.reducer(fn, schema)` form —
not on the `@langchain/langgraph/zod` export this file uses.

**`shop.ts` is here although no ch03 listing imports it.** Every chapter
directory carries the same one-line re-export so that both printed import
forms — `"./shop.js"` and `"../shop/tools.js"` — resolve wherever you paste
them. `supersteps.ts` and `walk.ts` use it for `STEP_NAMES` and `runTool`.

**`PlanState` here is not chapter 2's state.** Chapter 2 named the node `plan`
and the channel `steps`; this chapter takes the opposite trade — channel
`plan`, node `planner` — and it is this pairing the later chapters keep. Both
are legal, for the reason `name-clash.ts` prints. Choosing once, before
anything is written to a checkpoint, is the part that matters.
