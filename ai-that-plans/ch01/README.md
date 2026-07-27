# ch01 — When a while-loop stops being enough

The mechanism the rest of the book gets from a framework, written once by hand:
a state shape, a file store, and a loop that saves after every step. Thirty-odd
lines, deleted in chapter 2.

The job is the warranty repair the chapter opens with — *"My Verano hybrid is
under warranty and the rear hub is grinding"* — planned into six ordered steps
and executed one at a time against Book 3's tool surface, with the run's state on
disk between every one of them.

| File | What it does | Needs |
|---|---|---|
| [`state.ts`](state.ts) | `RunState`. Four fields and no `currentStep` — the cursor is `done.length`. | — |
| [`steps.ts`](steps.ts) | `plan()`, the model call whose output is data, filtered against the six known names. Plus `execute()`, which the chapter names but does not print. | key (for `plan`) |
| [`store.ts`](store.ts) | `load` and `save`. Write-to-scratch-then-rename, and `ENOENT` told apart from every other error. | — |
| [`run.ts`](run.ts) | The loop. One `load` at the top, one `save` after every step, and a `??` where a `resume()` would be. | key |
| [`inspect.ts`](inspect.ts) | The inspectable half: one line per run, printed by a process that owns none of them. | — |
| [`main.ts`](main.ts) | Points `run()` at a run id and a task. The chapter default; not printed in the book. | key |

`main.ts` and the `execute()` half of `steps.ts` are the two files the chapter
names but never prints. Everything else is a printed listing, byte for byte.

## Run it

```bash
npm run run-example -- ch01/main          # the chapter default
npm run run-example -- ch01/main r_9c04   # same job, a second run id
npm run run-example -- ch01/inspect       # what is in flight, no key needed
```

Without going through npm:

```bash
node --env-file-if-exists=../.env --env-file-if-exists=.env --import tsx ch01/main.ts
node --import tsx ch01/inspect.ts
```

State is written to `.runs/<runId>.json`, **relative to the working directory** —
so run these from this package root (`ai-that-plans/`), not from `ch01/`.
`.runs/` is scratch: deleting it is how you get a fresh start.

## Expected output

`ch01/main` prints the run id and the task, then one line per step as it starts,
then the finished state:

```
r_8f21: Verano hybrid under warranty, rear hub grinding.
  1/6 lookup_order
  2/6 check_warranty
  3/6 find_parts
  4/6 order_part
  5/6 book_workshop_slot
  6/6 notify_customer

6/6 steps, .runs/r_8f21.json
  lookup_order: ORD-4471, frame VER-8802, bought 2025-11-03
  check_warranty: in cover to 2027-11-03, parts and labour
  find_parts: HUB-VR-142 rear hub, Coldharbour Distribution, GBP 68.40
  order_part: ordered HUB-VR-142, reference PO-1001
  book_workshop_slot: next free bay: Thursday, 09:00
  notify_customer: draft written, not sent
```

The six results are fixtures and identical on every machine. The one thing that
can vary is the **plan**: it is a model call, and a planner that returns five
steps or a different order gives you a shorter numbered list. That variance is
the chapter's point — it is why losing the plan costs a second call that "may not
come back the same".

**Run it again with the same run id and no numbered lines appear at all** — just
the header and the finished state. `load` found the file, `done.length` is
already 6, the loop body never runs, and no model call is made. Delete `.runs/`
and the planner runs again.

`ch01/inspect` prints one line per run — the sentence support needs:

```
r_8f21 3/6 next=order_part at=2026-07-27T09:14:02.881Z
```

after an interrupted run, and `r_8f21 6/6 next=done at=…` after a finished one.
It needs no key, no loop, and no process that owns the run — but it does need
`.runs` to exist. On a clean clone it throws `ENOENT`, because the printed
listing calls `readdir(".runs")` with no guard and this file reproduces it as
printed. Run `ch01/main` once first.

`state.ts` is types only and prints nothing if you run it. `store.ts`, `run.ts`
and `steps.ts` export functions; they are imported, not run.

## Break it on purpose

The chapter's four experiments, and what each one should show you.

**Kill it and start it again.** `Ctrl-C` during step three, then run the identical
command. The numbered lines start at `4/6`, not `1/6`, and the planner is not
called a second time. Then `rm -rf .runs` and run it once more: the numbering
starts at `1/6` and the model call happens again.

There is a delay of about a second per step so that interrupting mid-run is
physically possible — the shop fixture answers instantly, and a loop that
finishes in nine milliseconds cannot be interrupted at step three. Set
`PLANS_STEP_DELAY_MS=0` for an instant run.

**Kill it inside the save.** Put `process.exit(1)` between `writeFile` and
`rename` in `store.ts`, run it, and confirm `ch01/inspect` still reads the run
and `ch01/main` still resumes it — the scratch file is the casualty, not the
state. Then replace the two-step write with `await writeFile(target, …)` and do
it again: `cat .runs/r_8f21.json` and read the truncated JSON that will never
parse again.

**Run two processes on the same run id at once.** Start one, then start another
with the same id in a second terminal. Both finish, both report `6/6`, and the
file holds whichever `rename` landed last. Nothing anywhere reports an error.

**Edit the file mid-run.** Stop the run, open `.runs/r_8f21.json`, delete the last
entry from `done`, and start it again — that step runs a second time. Then add a
step name to `plan` and watch the loop obey your text editor.

## Where this differs from the page

**The `find_parts` result.** The chapter's sample `.runs/r_8f21.json` shows
`"HUB-VR-142 rear hub, in stock, Coldharbour, GBP 68.40"`. The shop fixture in
[`../shop/tools.ts`](../shop/tools.ts) — shared with every other chapter — has no
stock field and names the supplier in full, so a real run writes
`"HUB-VR-142 rear hub, Coldharbour Distribution, GBP 68.40"`. Every other value
in that sample, and the whole of the `ch01/inspect` line, is exact.

**`docker compose run ai-that-plans ch01`.** The chapter offers this as the
no-install route. This package's `docker-compose.yml` currently defines only the
Postgres service that chapters 6 onward need, so use the `npm run run-example`
form above until an app service exists.

**`.runs/` is not in `.gitignore`.** It is scratch and should never be committed;
delete it rather than staging it.
