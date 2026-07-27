# ch13 — Debugging a graph that loops or stalls

Two jobs came back wrong overnight. Job **4818** threw `GraphRecursionError`
after twenty-five supersteps; job **4823** threw nothing at all and the
customer is still waiting. One failure is loud, one is silent, and both are
read from the same place: the chain of checkpoints the graph has been writing
since chapter 5.

This directory is the instrument, not the graph. Nothing here is a new agent —
it is chapter 4's routed graph (`plan`, `execute`, `advance`, `notify`, with
the retry edge) compiled with chapter 6's SQLite checkpointer, two threads
deliberately broken, and four small functions that read the record back.

**Nothing in this directory calls a model.** The plan is written down rather
than asked for, because every diagnostic here reads a run that has *already*
gone wrong, and an incident you replay should replay the same way twice. Run
the whole chapter on a clean clone with no key, no container and no network.

| File | What it does | Needs |
|---|---|---|
| [`fingerprint.ts`](fingerprint.ts) | `stable`, `fingerprint`, `pick`. Order-independent JSON and an FNV-1a digest, so one state has one mark. | — |
| [`state.ts`](state.ts) | **Partly printed.** Chapter 4's state declaration with `PROGRESS` added at the bottom, beside the channels it names. | — |
| [`inspect.ts`](inspect.ts) | The chapter's instrument: one thread, four columns, oldest first. | — |
| [`loop.ts`](loop.ts) | `findRepeat`. The longest run of checkpoints that made no progress, and the node names it cycled between. | — |
| [`stalled.ts`](stalled.ts) | `pendingPause`. A next node plus an unanswered question equals a stall; either one alone does not. | — |
| [`answer.ts`](answer.ts) | Answer a days-old pause from a process that was not running when it was written. | — |
| [`thread-budget.ts`](thread-budget.ts) | `MAX_THREAD_STEPS` and `runOnce`: the ceiling the recursion limit is not, because it is per invocation and a queue retries. | key¹ |
| [`draw.ts`](draw.ts) | The graph you actually compiled, drawn from its real edges. `getGraphAsync` / `getSubgraphsAsync`, not the deprecated sync pair. | — |
| [`detect.test.ts`](detect.test.ts) | **Not from the book.** Fifteen tests over hand-built snapshots — the chapter's claim that all three loop causes reproduce without a network. In `npm run verify`. | — |
| [`graph.ts`](graph.ts) | **Not printed.** Chapter 4's routed graph, compiled with a checkpointer. | — |
| [`checkpointer.ts`](checkpointer.ts) | **Not printed.** Chapter 6's `SqliteSaver.fromConnString("./ch13.sqlite")`. | — |
| [`nodes.ts`](nodes.ts) | **Not printed.** `execute`, `advance`, `notify`. `advance` is the only code that resets `attempts`; `execute` raises chapter 8's pause in front of the money. | — |
| [`route.ts`](route.ts) | **Not printed.** `decide`, unchanged since chapter 4. Six lines, no network, and where all three loop causes land. | — |
| [`plan.ts`](plan.ts) | **Not printed.** Chapter 4's planner, plus `fixedPlan` — the planner an incident already has the answer for. | key² |
| [`tools.ts`](tools.ts) | **Not printed.** Chapter 4's result-returning `runStep`, plus `alwaysFail` (a step that fails permanently) and the proposal the pause carries. | — |
| `shop.ts` | **Not printed.** One line: `export * from "../shop/tools.js";`, so `./shop.js` resolves here too. | — |
| [`looping-graph.ts`](looping-graph.ts) | **Not from the book.** Broken graph one: the `attempts` reset moved into `execute`. This is job 4818. | — |
| [`swallowing-graph.ts`](swallowing-graph.ts) | **Not from the book.** Broken graph two: `try`/`catch` around the interrupt. Buys a hub nobody approved. | — |
| [`seed.ts`](seed.ts) | **Not from the book.** Writes jobs 4818, 4823 and 4830 into `./ch13.sqlite` so the printed commands have something to read. | — |
| [`run-examples.ts`](run-examples.ts) | **Not from the book.** Seeds the store, then reads it back with every instrument in the chapter. The chapter default. | — |
| [`break-it.ts`](break-it.ts) | **Not from the book.** The chapter's five experiments, run in order, on `MemorySaver`s that touch nothing on disk. | — |

¹ `runOnce` refuses a thread that has spent its budget *without invoking*, which
is the path `run-examples.ts` exercises. On a thread with budget left it invokes
the graph, and a fresh thread starts at `plan`, which calls the model.

² Only if you build the graph without passing `fixedPlan`. No file in this
directory does.

## Run it

From the `ai-that-plans` directory. **Run `run-examples` first** — it writes the
store that everything else reads.

```bash
npx tsx ch13/run-examples.ts               # seeds ./ch13.sqlite, then reads it
npx tsx ch13/inspect.ts job-4818           # the loop
npx tsx ch13/inspect.ts job-4823           # the stall
npx tsx ch13/answer.ts job-4823 approve    # answer the pause
npx tsx ch13/draw.ts                       # the graph you compiled
npx tsx ch13/break-it.ts                   # the five experiments
npx vitest run ch13                        # the fifteen tests
```

Once the repo-level runner is in place, the same commands read `../.env` and
`.env` first:

```bash
npm run run-example -- ch13
npm run run-example -- ch13/inspect job-4818
npm run run-example -- ch13/answer job-4823 approve
```

`fingerprint.ts`, `state.ts`, `loop.ts`, `stalled.ts`, `route.ts`, `nodes.ts`,
`graph.ts`, `plan.ts`, `tools.ts`, `checkpointer.ts` and the two broken graphs
are modules: running them directly prints nothing, which is correct.

`./ch13.sqlite` is git-ignored, along with the two WAL sidecars SQLite leaves
beside it. `run-examples.ts` deletes all three before it seeds, so the output
below is what you get every time.

## Expected output

### `run-examples.ts`

Deterministic, line for line.

```text
--- job 4818: the graph that spins --------------------------------------
plan: lookup_order, check_warranty, find_parts, order_part, book_workshop_slot, notify_customer
 -1 + __start__
  0 = plan
  1 + execute
  2 + advance
  3 + execute
  4 + advance
  5 + execute
  6 = execute
  7 = execute
  8 = execute
  … and 17 more, all of them "=".

--- findRepeat: which loop, and from where ------------------------------
cycle=execute laps=21 fromStep=5
The exception told you a loop happened. The cycle tells you which one.

--- the ceiling the recursion limit is not ------------------------------
job-4830: 3 invocations, each with a fresh allowance of 25 supersteps
metadata.step on the newest checkpoint: 79
runOnce -> ok=false reason=exhausted spent=79 (MAX_THREAD_STEPS=60)

--- job 4823: the graph that waits --------------------------------------
plan: lookup_order, check_warranty, order_part, book_workshop_slot, notify_customer
 -1 + __start__
  0 = plan
  1 + execute
  2 + advance
  3 + execute
  4 + advance
  5 + execute      PAUSED

execute asked: {"code":"HUB-VR-142","priceGbp":68.4}
waiting 0 s (a real sweep sorts every open thread by this)

findRepeat on the stalled thread: undefined — a stall is one link, not a shape.

--- the graph you actually compiled -------------------------------------
__start__ --> plan;
advance --> execute;
notify --> __end__;
plan --> execute;
execute -. &nbsp;continue&nbsp; .-> advance;
execute -. &nbsp;finish&nbsp; .-> notify;
execute -. &nbsp;retry&nbsp; .-> execute;

0 subgraphs — this chapter's graph is flat, and printing nothing here
when you expected a specialist is the fastest way to find the one you
never nested.
```

Five things to read off that page.

**Step `-1` is `+` and step `0` is `=`, structurally.** The input checkpoint has
nothing before it to compare against, and all `__start__` did was write the
request into `messages`, which is not a progress channel. The job had not
started and the column says so correctly.

**`findRepeat` returns `execute`, 21 laps, from step 5.** That is the chapter's
number, produced rather than asserted: a self-loop on the retry edge, which
narrows three possible causes to the two that can produce one node name.

**Three invocations spend 79 supersteps on one `thread_id`.** Each one had a
fresh allowance of 25 and each one hit it, and nothing in LangGraph was
counting, because nothing in LangGraph knows the three are the same piece of
work. `runOnce` refuses the fourth on `metadata.step` alone — no invoke, no
tokens.

**The stalled thread has six checkpoints and one of them is holding a
question.** `execute` asked for `{"code":"HUB-VR-142","priceGbp":68.4}`, which
is durable, so an approval screen can be rebuilt from the checkpoint days later
by a process that has never seen this job.

**Three dashed edges, three routes.** The path map put `continue`, `finish` and
`retry` on the drawing. Count more dashed edges than routes and the path map is
missing.

### `inspect.ts`

```text
$ npx tsx ch13/inspect.ts job-4818
 -1 + __start__
  0 = plan
  1 + execute
  2 + advance
  3 + execute
  4 + advance
  5 + execute
  6 = execute
  7 = execute
  8 = execute
```

…and the rest of the file is that last line again, once per superstep, to step
`25`. Five supersteps of real work, then a column of `=` marching to the wall.

```text
$ npx tsx ch13/inspect.ts job-4823
 -1 + __start__
  0 = plan
  1 + execute
  2 + advance
  3 + execute
  4 + advance
  5 + execute      PAUSED
```

### `answer.ts`

```text
$ npx tsx ch13/answer.ts job-4823 approve
execute asked: {"code":"HUB-VR-142","priceGbp":68.4}
```

It prints the question, then resumes; the resume itself is silent. Run
`inspect` afterwards and the thread has run to `END`:

```text
 -1 + __start__
  0 = plan
  1 + execute
  2 + advance
  3 + execute
  4 + advance
  5 + execute      PAUSED
  6 + advance
  7 + execute
  8 + advance
  9 + execute
 10 + notify
 11 = -
```

Step 5 still reads `PAUSED`, and it should: that checkpoint really did hold an
unanswered question, and the record does not get rewritten because the story
ended well. On a thread with nothing waiting:

```text
$ npx tsx ch13/answer.ts job-4818 approve
nothing on this thread is waiting for an answer
```

Re-seed with `npx tsx ch13/run-examples.ts` to put the pause back.

### `draw.ts`

The whole Mermaid document, nodes and classes included, then nothing — this
graph is flat, so the subgraph loop prints no second block.

```text
%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	plan(plan)
	execute(execute)
	advance(advance)
	notify(notify)
	__end__([<p>__end__</p>]):::last
	__start__ --> plan;
	advance --> execute;
	notify --> __end__;
	plan --> execute;
	execute -. &nbsp;continue&nbsp; .-> advance;
	execute -. &nbsp;finish&nbsp; .-> notify;
	execute -. &nbsp;retry&nbsp; .-> execute;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
```

### `detect.test.ts`

```text
 Test Files  1 passed (1)
      Tests  15 passed (15)
```

Milliseconds. No graph is compiled, no checkpointer is opened, no key is read.

## Break it on purpose

`npx tsx ch13/break-it.ts` runs the chapter's five experiments in order. Each
one builds its own graph on its own `MemorySaver`, so the correct code in this
directory stays correct and `./ch13.sqlite` is untouched.

```text
--- 1. move the attempts reset into execute ----------------------------
progress column: +=+++++====================
next, last lap:  execute
findRepeat: cycle=execute laps=21 fromStep=5

--- 2. add messages to PROGRESS ----------------------------------------
PROGRESS              -> +=+++++====================
PROGRESS + messages   -> +++++++++++++++++++++++++++
findRepeat with messages in the list: undefined

--- 3. catch the interrupt ---------------------------------------------
  [node caught GraphInterrupt, logged it, and carried on]

no guard: paused=false
no guard: completed=lookup_order,check_warranty,order_part,book_workshop_slot,notify_customer
no guard: orders placed = 1

isGraphInterrupt rethrow: paused=true
isGraphInterrupt rethrow: orders placed = 0

--- 4. resume with the wrong thread id ---------------------------------
job_4823: invoke resolved, and nothing complained
job_4823 (underscore): 1 checkpoints
job-4823 (hyphen):     7 checkpoints
the real pause is still there: yes, at execute

--- 5. return a string from a node -------------------------------------
INVALID_GRAPH_NODE_RETURN_VALUE
Expected node "advance" to return an object or an array containing at least one Command object, received string

INVALID_CONCURRENT_GRAPH_UPDATE
Invalid update for channel "cursor" with values [1,2]: LastValue can only receive one value per step.
```

(The narration between the blocks is trimmed here; the script prints it.)

**Experiment 2 is the one worth feeling once.** The same twenty-seven
checkpoints, the same visibly looping run, and a detector that reports clean
because one effort channel got into the progress list. A progress list with
`messages` in it is a smoke alarm with the battery out.

**Experiment 3 is the only one that costs money.** `orders placed = 1` on a run
nobody approved: the pause was raised, thrown, caught by a well-meaning
`try`/`catch`, logged, and the node carried on to the supplier. One line —
`if (isGraphInterrupt(error)) throw error;` — turns it back into `paused=true`
and `orders placed = 0`.

**Experiment 5's two failures are one error class.** `InvalidUpdateError` twice,
`lc_error_code` different both times. Match on the code in a log pipeline; the
prose is not an API.

### Two claims from the chapter, checked here rather than asserted

The error the loop ends with, verbatim from the shipped library:

```text
Recursion limit of 25 reached without hitting a stop condition. You can
increase the limit by setting the "recursionLimit" config key.

Troubleshooting URL: https://docs.langchain.com/oss/javascript/langgraph/GRAPH_RECURSION_LIMIT/
```

`lc_error_code` is `GRAPH_RECURSION_LIMIT`. And `getStateHistory` on a graph
compiled without a checkpointer throws `GraphValueError` — `No checkpointer
set`, `lc_error_code: "MISSING_CHECKPOINTER"` — which is the framework telling
you that you cannot debug what you did not save.

## Where this differs from the page

**`ch13/loop.ts` and `ch13/stalled.ts` are the two detectors, not the two
broken graphs.** The chapter prints `findRepeat` under a `// ch13/loop.ts`
header and `pendingPause` under `// ch13/stalled.ts`, so those names are taken.
The two deliberately broken graphs the repository README promises are
[`looping-graph.ts`](looping-graph.ts) and
[`swallowing-graph.ts`](swallowing-graph.ts).

**The plan is written down, not asked for.** `buildGraph` takes an optional
second argument, and every runnable file here passes `fixedPlan([…])`. The
chapter's printed listings all call `buildGraph(openCheckpointer())` and get
chapter 4's model-backed planner, unchanged; the default is there so those
lines stay exactly as the page has them. Asking a model for the plan would make
the printed traces different on every machine and put a bill on a debugging
exercise.

**The two plans are read off the chapter's own step numbers.** Job 4818 first
fails at superstep 6 with the cursor on index 2, and index 2 of the six-step
plan is `find_parts` — the step the chapter makes fail permanently. Job 4823
pauses at superstep 6 with the cursor on index 2, and the pause is the money
step, so *its* plan is five steps with `order_part` at index 2. Neither plan is
printed in the book; both are forced by the traces that are.

**`execute` does two things chapter 4's `execute` did not**, and both are
required by chapter 13's prose rather than invented for it. It appends to
`messages` on every attempt — §"Progress is not the same as movement" describes
a broken run as one where "a message gets appended", and without it the second
experiment cannot fire. And it raises chapter 8's pause in front of
`order_part`, carrying "the part code and the price", which is what job 4823's
`PAUSED` checkpoint holds. Neither touches a progress channel, so the printed
four-column traces are unchanged.

**`alwaysFail` is a fixture the shared shop does not have.** The chapter's first
loop cause is "put a step in the plan that fails permanently"; `../shop/tools.ts`
only has a step that fails *once* per cursor, which is a working retry rather
than a loop. One test seam in [`tools.ts`](tools.ts), set by `seed.ts` and by
experiment 1, and cleared in a `finally`.

**The planner is built on first call, not at import** — chapter 4's deviation,
carried forward, so `inspect.ts` and `draw.ts` can import `graph.ts` on a
machine with no key. Drawing a graph is not calling a model.

**`state.ts` exports `PlanUpdate`.** The printed `thread-budget.ts` imports it
from `./state.js`; chapter 4's state file exported `State` only. One line, at
the bottom, beside `PROGRESS`.

**Experiment 5's first failure needs a cast.** `addNode("advance", () => "done")`
does not compile, which is the good news and worth noticing. The cast in
`break-it.ts` exists only so the runtime error can be printed next to the other
one.
