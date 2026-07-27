# ch05 — Checkpoints: state that outlives the process

One six-node job, a `SqliteSaver` writing to `./ch05.sqlite`, and a switch that
kills the process on cue. Nothing here calls a model: the chapter's experiment
is *kill the process and see what survives*, which is only an experiment if the
same input produces the same run every time.

**Everything in this directory runs with no API key, no container and no
network.**

| File | What it does | Needs |
|---|---|---|
| [`state.ts`](state.ts) | The job's state. Six last-value fields and a `done` list that appends, so a resumed run can prove which steps it did not repeat. | — |
| [`graph.ts`](graph.ts) | The six nodes in a line. `buildGraph(checkpointer)` takes the checkpointer as a parameter, because that is the only thing chapter 6 changes. | — |
| [`steps.ts`](steps.ts) | The nodes. `enter()` prints the step name, honors `CRASH_AT`, and honors `STEP_MS`. | — |
| [`run.ts`](run.ts) | Runs the job on a thread id. The clean run, and the crash when `CRASH_AT` is set. | — |
| [`resume.ts`](resume.ts) | Reads the thread's last checkpoint and carries on. `invoke(null, config)` — no request, no memory of the old process. | — |
| [`history.ts`](history.ts) | The whole chain, newest first: step number, next-node pointer, size of `done`. | — |
| [`durability.ts`](durability.ts) | The same run under `"sync"`, `"async"` or `"exit"`. | — |
| [`drain.ts`](drain.ts) | A cooperative stop: `SIGTERM` sets a flag, the graph stops at the next superstep boundary and throws `GraphDrained`. | — |
| [`measured.ts`](measured.ts) | The five-method checkpointer wrapper that counts `puts`, `writes` and `ms`. A class; nothing runs it on its own. | — |
| `measure.ts` | **Not from the book.** Runs one job through `Measured` and prints the three numbers the chapter tells you to read. | — |
| `shop.ts` | **Not from the book.** The fixture the nodes read, plus a re-export of [`../shop/tools.ts`](../shop/tools.ts). | — |

The SQLite file is written to the package root (`ai-that-plans/ch05.sqlite`),
because that is where npm runs the script from. It is git-ignored. Delete it to
start clean:

```bash
rm -f ch05.sqlite
```

A thread id is an argument, never a default, and **re-using one appends to it**
rather than starting over. Use a fresh id per experiment; the ids below are the
ones the chapter prints.

## Run it

### The clean run

```bash
npm run run-example -- ch05/run job-4817
```

```text
lookup_order
check_warranty
find_parts
order_part
book_workshop_slot
notify_customer
finished: lookup_order -> check_warranty -> find_parts -> order_part -> book_workshop_slot -> notify_customer
```

(The book wraps that last line to fit the page. It is one line here.)

### Kill it in the middle

```bash
CRASH_AT=find_parts npm run run-example -- ch05/run job-4818
```

```text
lookup_order
check_warranty
find_parts: killing the process
```

Exit code 1, no `finally` blocks, nothing flushed. Everything the run knew is
in `ch05.sqlite`, in a chain that stops one checkpoint short of where the
process did.

### Resume it, in a different process

```bash
npm run run-example -- ch05/resume job-4818
```

```text
resuming at: find_parts
already done: lookup_order, check_warranty
find_parts
order_part
book_workshop_slot
notify_customer
finished: lookup_order -> check_warranty -> find_parts -> order_part -> book_workshop_slot -> notify_customer
```

Two lines are the chapter. `resuming at:` is the next-node pointer, read out of
a file by a process that has never seen this job. `already done:` is the channel
values — two entries, not four, so the first two steps were not redone.

`CRASH_AT=lookup_order` on a fresh id is the boundary case: the resume prints
`resuming at: lookup_order` and `already done: (nothing)`.

### Read the chain

```bash
npm run run-example -- ch05/history job-4817
```

```text
 6  -                   done=6
 5  notify_customer     done=5
 4  book_workshop_slot  done=4
 3  order_part          done=3
 2  find_parts          done=2
 1  check_warranty      done=1
 0  lookup_order        done=0
-1  __start__           done=0
```

Eight checkpoints for six nodes: the framework's `__start__` gets a superstep
like any other, and step `-1` is the checkpoint written from the input itself.
Run `ch05/run job-4817` a second time and this list grows to sixteen rows —
one chain, two runs, nothing overwritten.

### The three durability settings

```bash
npm run run-example -- ch05/durability job-dur-sync sync
npm run run-example -- ch05/durability job-dur-async async
npm run run-example -- ch05/durability job-dur-exit exit
```

Each prints the six node names and nothing else. The difference is in the
history:

```bash
npm run run-example -- ch05/history job-dur-sync    # 8 rows
npm run run-example -- ch05/history job-dur-async   # 8 rows
npm run run-example -- ch05/history job-dur-exit    # 1 row
```

The `"exit"` thread's single row is `6  -  done=6`. Nothing about the graph
changed.

`"exit"` survives an exception and not a dead process, which you can watch:

```bash
CRASH_AT=find_parts npm run run-example -- ch05/durability job-4822 exit
npm run run-example -- ch05/history job-4822    # prints nothing at all
npm run run-example -- ch05/resume job-4822     # Error: Nothing to resume on job-4822
```

`getState` on a thread with no checkpoints returns an empty snapshot rather
than throwing, which is why `resume.ts` guards on `next.length` and not on a
caught error.

### Drain instead of dying

Two terminals. In the first:

```bash
STEP_MS=1500 npm run run-example -- ch05/drain job-4819
```

In the second, while the first is on its third node:

```bash
kill -TERM $(pgrep -n -f 'ch05/drain')
```

`pgrep -n` picks the **newest** process whose command line matches, which is
the node process rather than the npm and shell wrappers above it. Signal one of
those instead and you get a hard kill, not a drain — which is the same
distinction the section is about, arriving by accident.

The first terminal prints:

```text
lookup_order
check_warranty
find_parts
drained: sigterm
thread job-4819 is resumable
```

`find_parts` **finished** — the drain is cooperative, so the node completed,
its writes merged and its checkpoint landed before anything unwound. Exit code
is 0: a drained run is not a failed run. Resuming proves where it stopped:

```bash
npm run run-example -- ch05/resume job-4819
```

```text
resuming at: order_part
already done: lookup_order, check_warranty, find_parts
order_part
book_workshop_slot
notify_customer
finished: lookup_order -> check_warranty -> find_parts -> order_part -> book_workshop_slot -> notify_customer
```

Send `SIGKILL` instead — `kill -KILL $(pgrep -n -f 'ch05/drain')` — and you get
the crash case back: no handler, no boundary, and `already done:` one step
shorter.

### Measure what a write costs you

```bash
npm run run-example -- ch05/measure job-m1 async
```

```text
lookup_order
check_warranty
find_parts
order_part
book_workshop_slot
notify_customer
durability:  async
puts:        8
writes:      7
ms in store: 6.1
ms wall:     22.6
```

`puts` and `writes` are exact and reproducible: 8 checkpoints for 7 supersteps
(*N* + 1), and one `putWrites` per task that produced writes. Under `sync` they
are the same 8 and 7 — the saving from `async` is latency, not writes. Under
`exit` they are 1 and 0.

The two `ms` numbers are the only machine-dependent output on this page, and
they are the point: their **ratio** is the decision. Against a local SQLite file
and six nodes that do no work, persistence is roughly a quarter of the run —
which is exactly the wrong conclusion to carry anywhere, because a real step
waits on a model. Run it against your store, with your state, and read your own
ratio.

## One thing to read twice

`Measured`'s `inner` field is typed as the abstract `BaseCheckpointSaver`, not
as `SqliteSaver`. Narrowing it is the obvious next thought and it does not
compile: only the abstract class declares a four-parameter `put`, and
`SqliteSaver` declares its own with three. Keep it abstract and the wrapper
takes anything — including whatever chapter 6 leaves you with.
