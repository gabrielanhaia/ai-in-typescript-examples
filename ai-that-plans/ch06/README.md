# ch06 — Picking a real store: SQLite, then Postgres

The graph from chapter 4 with its checkpointer pulled out into an argument, and
three things to put in that argument. `buildGraph` does not change between them:
what changes is where the state is when the process ends, and what you now owe
somebody to keep it there.

| File | What it does | Needs |
|---|---|---|
| [`checkpointer.ts`](checkpointer.ts) | `openCheckpointer(kind)` — the whole swap, behind one function. Also the pool this book sizes on purpose, and `closeCheckpointer`, which is why the scripts exit. | — |
| [`state.ts`](state.ts) | Chapter 3's three channels, unchanged. `messages` is the one that decides what a backend costs. | — |
| [`graph.ts`](graph.ts) | Chapter 4's two nodes and loop. The only line this chapter touched is the signature. | key |
| [`run.ts`](run.ts) | The runner you point at all three. `CHECKPOINTS` picks the backend, `argv[2]` picks the thread. | key |
| [`shop.ts`](shop.ts) | Re-export of [`../shop/tools.ts`](../shop/tools.ts), so the printed `./shop.js` import resolves. | — |
| [`compose.yaml`](compose.yaml) | The chapter's Postgres, and the volume line that is the whole point of it. | Docker |
| [`setup-db.ts`](setup-db.ts) | The deploy step: `setup()` once, from one place, plus the `thread_owner` table LangGraph will not create for you. | Postgres |
| [`ownership.ts`](ownership.ts) | The join the framework does not have. Thread ids in, customer ids beside them. | Postgres |
| [`forget.ts`](forget.ts) | One customer's threads, deleted. Short on purpose, and the shape is the argument. | Postgres |
| [`threads.sql`](threads.sql) | How big is each thread and how stale — the operational question, asked in SQL because it is a `GROUP BY`. | Postgres |
| `run-examples.ts` | **Not from the book.** The chapter's first exercise, with no key and no container. The chapter default. | — |

## Run it

Every listing can be run two ways. The book's command is the first one; the
second is what it runs underneath, and it works whatever else is going on in
the repository.

```bash
npm run run-example -- ch06/run-examples     # or: npx tsx ch06/run-examples.ts
```

### Nothing at all — no key, no container, no network

```bash
npx tsx ch06/run-examples.ts
```

```text
thread job-64126

memory  run 1  started from nothing          6 steps done
memory  run 2  started from nothing          6 steps done
sqlite  run 1  started from nothing          6 steps done
sqlite  run 2  resumed a thread it had seen  6 steps done

memory forgot between runs, sqlite did not. The file is at
data/braxby.sqlite — sqlite3 data/braxby.sqlite "select count(*) from checkpoints"
```

The number after `thread` is this process's pid, so it is different every time
and the first `sqlite` run is always a new thread. Four runs, four freshly
built checkpointers — which is what a second process looks like from the
storage's side. The two `memory` lines are identical because a new
`MemorySaver` has never heard of the thread; the second `sqlite` line is the
chapter in one word.

Then the file it left behind, which is the part `MemorySaver` has no answer to:

```bash
sqlite3 data/braxby.sqlite "select count(*) from checkpoints"
sqlite3 data/braxby.sqlite ".tables"
```

```text
9
checkpoints  writes
```

Nine checkpoints for one completed job — the input, the plan, and one per
`work` superstep — in the two tables the chapter names. `data/` is git-ignored;
delete the file whenever you like and the next run creates it again.

### With an API key — the chapter's own runner

`ch06/run.ts` asks the model for the plan, so this one needs
`ANTHROPIC_API_KEY`. Without it, `graph.ts` throws `Anthropic API key not
found` on the line that constructs `ChatAnthropic`, before any request is made.

```bash
CHECKPOINTS=memory npx tsx ch06/run.ts job-a     # then again, same command
CHECKPOINTS=sqlite npx tsx ch06/run.ts job-a     # then again, same command
```

```text
memory job-a [
  'ORD-4471, frame VER-8802, bought 2025-11-03',
  'in cover to 2027-11-03, parts and labour',
  'HUB-VR-142 rear hub, Coldharbour Distribution, GBP 68.40',
  'refused: a human decides this one',
  'next free bay: Thursday, 09:00',
  'draft written, not sent'
]
```

Six lines when the model plans all six steps, which is what it does with this
prompt; the plan comes from the model, so a shorter one is a different plan
rather than a bug. `memory` prints the same six on the second run because it
did the whole job again. `sqlite` prints them without doing any work at all,
because `getState` found a `createdAt` and the input became `null`.

### With Postgres

The container this repository ships is at the root, and it publishes **5433**
rather than 5432 so it cannot collide with Book 2's:

```bash
npm run db:up                      # docker compose up -d, at the repo root
npx tsx ch06/setup-db.ts
```

```text
schema braxby is ready
```

Idempotent — run it twice and it says the same thing. What it left:

```bash
docker exec atp-postgres psql -U braxby -d braxby -c "\dt braxby.*"
```

```text
 Schema |         Name          | Type  | Owner
--------+-----------------------+-------+--------
 braxby | checkpoint_blobs      | table | braxby
 braxby | checkpoint_migrations | table | braxby
 braxby | checkpoint_writes     | table | braxby
 braxby | checkpoints           | table | braxby
 braxby | thread_owner          | table | braxby
```

The chapter's four, plus the one that is yours. Then a run against it, and the
report:

```bash
CHECKPOINTS=postgres npx tsx ch06/run.ts job-a
docker exec -i atp-postgres psql -U braxby -d braxby -f - < ch06/threads.sql
```

```text
 thread_id | checkpoints |        last_write
-----------+-------------+--------------------------
 job-a     |           9 | 2026-07-27T22:47:53.388Z
(1 row)
```

Nine again — the same thread costs the same number of records whichever
backend holds it. The timestamp is the run's, so yours differs.

### Deleting one customer

`forget.ts` reads `thread_owner`, so a thread has to have been claimed. Nothing
in the chapter's runner claims one — `claimThread` is called "when a thread id
is minted", which is your application's job — so do it by hand to see the
delete work end to end:

```bash
docker exec atp-postgres psql -U braxby -d braxby \
  -c "insert into braxby.thread_owner (thread_id, customer_id)
      values ('job-a', '4171') on conflict do nothing"
npx tsx ch06/forget.ts 4171
```

```text
deleted checkpoints for job-a
```

One line per thread. Run `threads.sql` again and that thread is gone from it;
run `forget.ts` for a customer who owns nothing and it prints nothing at all
and exits. With no argument it exits non-zero on `usage: forget <customerId>`.

### The compose file the chapter prints

```bash
docker compose -p ch06 -f ch06/compose.yaml up -d
```

The `-p ch06` is not in the book and is worth having: without it, Compose uses
the directory name as the project, which is the same project the repository's
own root `docker-compose.yml` uses, and the two files disagree about the
service called `postgres`. Read the rest of that paragraph under "Where this
differs from the page" — this file publishes **5432**, not 5433.

To meet the error the chapter shows you, change its `volumes:` line to
`- braxby-checkpoints:/var/lib/postgresql/data` and run it in the foreground:

```bash
docker compose -p ch06 -f ch06/compose.yaml up
```

The container prints the `pg_ctlcluster` refusal in full and exits before
Postgres runs. Put the line back afterwards.

### The two files with no output

`state.ts` and `checkpointer.ts` are modules — importing them prints nothing,
and that is the whole point of the second one. `ownership.ts` is three
functions; `graph.ts` is one. They are exercised by the files above.

## Where this differs from the page

**`DATABASE_URL` is already taken here.** The printed `pool()` reads
`process.env.DATABASE_URL`, which is the right name in an application that owns
its own database. This repository holds four books, and Book 2 publishes a
Postgres on 5432 under exactly that name — the root `.env.example` sets it.
Book 4's container is on 5433 under `PLANS_DATABASE_URL`. So `checkpointer.ts`
carries three lines that are **not** in the book, at the bottom of the file
under a comment saying so: `PLANS_DATABASE_URL` wins, then `DATABASE_URL`, then
a fallback of `postgresql://braxby:braxby@localhost:5433/braxby`. The printed
line is untouched, and every printed listing connects to the right database
without being edited.

**`ch06/compose.yaml` publishes 5432 and takes no password.** It is reproduced
exactly as printed, because it is a listing. It is not the container this
repository starts: `npm run db:up` runs the root `docker-compose.yml`, which
publishes 5433 with a password, for the collision reason above. If you would
rather run the chapter's file, set
`PLANS_DATABASE_URL=postgresql://braxby@localhost:5432/braxby` — no password,
because `POSTGRES_HOST_AUTH_METHOD: trust`.

**`checkpointer.ts` is printed in two pieces.** The factory early in the
chapter and `closeCheckpointer` at the end of "The connection pool you did not
know you had". They are one file, concatenated in the order printed, and the
`// ch06/checkpointer.ts, continued` line is kept because the page prints it.

**`data/` has to exist, and cannot be committed.**
`SqliteSaver.fromConnString("data/braxby.sqlite")` is a path relative to the
working directory, and the driver does not create the directory — it fails to
open the file. The repository root git-ignores `data/` entirely, so a clean
clone has no such directory and the printed `openCheckpointer("sqlite")` would
throw on the first run. One `mkdirSync("data", { recursive: true })` sits in
the unprinted block at the bottom of `checkpointer.ts`, which is the file that
owns the path.

**`@types/better-sqlite3` is not installed.** The chapter says to add it or
`tsc` will fail on the checkpointer package's own declarations. This project
sets `skipLibCheck: true` in `tsconfig.json` for an unrelated reason, and that
is enough on its own — `npm run typecheck` passes without the types package.
Add it if you turn `skipLibCheck` off.

**`run-examples.ts` is not from the book.** The chapter's exercises all need
either a key or a container, and the claim underneath the whole chapter —
memory forgets, a file does not — deserves to be runnable on a clean clone. It
is the chapter's code with the planner replaced by the plan it returns.
