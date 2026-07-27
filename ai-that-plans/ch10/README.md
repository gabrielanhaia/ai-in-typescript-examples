# ch10 — Time travel: reading and editing past state

Chapter 5's six-node job again, a `SqliteSaver` writing to `./ch10.sqlite`, and
three methods on top of it: `getStateHistory`, `getState` at a named checkpoint,
and `updateState`. There is no model call anywhere in this chapter, deliberately
— a chapter about reading and correcting a run's history is only teachable if
two runs of one input produce the same history.

**Everything in this directory runs with no API key, no container and no
network.**

| File | What it does | Needs |
|---|---|---|
| [`history.ts`](history.ts) | The chain, newest first: step, `source`, next-node pointer, and the tail of the checkpoint id. | — |
| [`at.ts`](at.ts) | `snapshotAtStep`. There is no read-the-checkpoint-at-step-N call, so this is it — a linear scan from the newest end. A module; nothing runs it. | — |
| [`inspect.ts`](inspect.ts) | One past checkpoint, printed whole. Not a rendering of what the run knew — what the run knew. | — |
| [`state.ts`](state.ts) | Chapter 5's state plus `message` and an `edits` channel, because checkpoint metadata has no seam for who-and-why. | — |
| [`patch.ts`](patch.ts) | `updateState` with `asNode`, then resume. The correction in place. | — |
| [`replace.ts`](replace.ts) | `Overwrite`, for the case where a hand edit must replace an accumulating channel instead of appending to it. | — |
| [`fork.ts`](fork.ts) | The same write, through an old snapshot's own `config`, so the new checkpoint's parent is that one and not the head. | — |
| [`branches.ts`](branches.ts) | The shape the flat history hides, rebuilt from `parentConfig`. One line per branch. | — |
| `graph.ts` | **Not from the book.** Chapter 5's six nodes in a line, which the chapter says it carries over unchanged. | — |
| `steps.ts` | **Not from the book.** Those six nodes. `notify_customer` writes the sentence into `message`, which is what `patch.ts` and `fork.ts` print. | — |
| `shop.ts` | **Not from the book.** The fixture — the wrong hub and the fixed slot the chapter's output depends on — plus a re-export of [`../shop/tools.ts`](../shop/tools.ts). | — |
| `run.ts` | **Not from the book.** Runs the job on a thread id. The chapter default, and the thing every other listing here reads. | — |

The SQLite file is written to the package root (`ai-that-plans/ch10.sqlite`),
because that is where npm runs the script from. It is git-ignored. Delete it to
start clean:

```bash
rm -f ch10.sqlite
```

A thread id is an argument. **Re-using one appends to it** rather than starting
over, which in this chapter is not a footnote — it is the subject. The ids below
are the ones the chapter prints.

## Run it

### Run the job, then read it back

```bash
npm run run-example -- ch10/run job-4817
npm run run-example -- ch10/history job-4817
```

```text
Your HUB-DX-135 is dispatched. We have you in on Tue 09:00.
```

```text
  6  loop    -                   ...0ed3b5
  5  loop    notify_customer     ...e757cd
  4  loop    book_workshop_slot  ...85ccb8
  3  loop    order_part          ...ea8a8b
  2  loop    find_parts          ...185452
  1  loop    check_warranty      ...e793fc
  0  loop    lookup_order        ...a7692f
 -1  input   __start__           ...45bf1e
```

Eight rows for six nodes, for chapter 5's reason: `__start__` takes a superstep
of its own and step `-1` is the checkpoint written from the input. The
checkpoint ids will not match the ones above — they are time-ordered UUIDs, so
yours are yours — and every other column will.

### Read one point in the past

```bash
npm run run-example -- ch10/inspect job-4817 2
```

```text
id       1f18a10a-11bf-65b0-8002-99b1a6185452
written  2026-07-27T23:12:25.227Z
source   loop
next     find_parts
values   {
  "request": "Verano hybrid, rear hub grinding, under warranty",
  "frameNumber": "VER-8802",
  "coverEndsOn": "2027-11-03",
  "partCode": "",
  "orderStatus": "",
  "slot": "",
  "message": "",
  "done": [
    "lookup_order",
    "check_warranty"
  ],
  "edits": []
}
```

### Correct it in place

```bash
npm run run-example -- ch10/patch job-4817 HUB-VR-142
```

```text
wrote    1f18a10a-4d13-6580-8007-472e06340164
resumes  order_part
Your HUB-VR-142 is dispatched. We have you in on Tue 09:00.
```

`ch10/history job-4817` now prints twelve rows, and row 7's `source` is
`update`. Rows 0 to 6 are untouched — checkpoint `...185452` still holds the
empty `partCode` and still says the next node is `find_parts`.

### Fork instead, and see the shape

```bash
npm run run-example -- ch10/run job-4818
npm run run-example -- ch10/fork job-4818 3 HUB-VR-142
npm run run-example -- ch10/branches job-4818
```

```text
-1:e885>0:0075>1:761e>2:f103>3:989b>4:1be5>5:1b5b>6:c77a>7:ce1c
-1:e885>0:0075>1:761e>2:f103>3:989b>4:5b3c>5:b723>6:2d7a
```

Shared as far as step 3, then two different step 4s. The flat history from
`ch10/history job-4818` shows the same twelve checkpoints interleaved by
creation time, with two rows numbered 4, two numbered 5 and two numbered 6 —
which is what `branches.ts` exists to undo.

### Replace an accumulating channel

```bash
npm run run-example -- ch10/replace job-4817
```

```text
[ 'lookup_order', 'check_warranty' ]
```

Without `Overwrite`, that write appends and `done` grows. With it, the reducer
is bypassed and the channel is set. A channel may receive only one `Overwrite`
per step.

## One thing to read twice

`ch10/run job-4817` a second time does not start the job over. It appends a
second run to the same chain, so the history grows and `snapshotAtStep` starts
finding two checkpoints per step number — which is the same ambiguity a fork
produces, arriving through the front door. `at.ts` returns the **later** one,
because the history runs newest first; a fresh thread id is how you avoid
needing to care.
