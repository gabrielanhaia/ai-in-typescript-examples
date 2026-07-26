# ch13 — When an agent is the wrong answer

The same job written twice: once as a loop, once as ordinary code with a model
call in it.

| File | What it does | Needs |
|---|---|---|
| [`weekly-report.ts`](weekly-report.ts) | The version that should ship. Every count counted, and the threshold is a constant. | — |
| [`covering-note.ts`](covering-note.ts) | One model call, not a loop. Facts in, phrasing out, and a truncated note falls back to the figures. | key |
| [`weekly-report.test.ts`](weekly-report.test.ts) | The boundary case at exactly the threshold. In `npm run verify`. | — |
| [`report-tools.ts`](report-tools.ts) | The three read-only tools the agent version is given, and the one — `send_email` — it deliberately is not. | — |
| [`report-agent.ts`](report-agent.ts) | Built as a loop, for comparison rather than for production. Spends tokens. | key |
| `run-examples.ts` | **Not from the book.** The script version, run. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch13
npm test -- ch13
```

## Expected output

```text
Manchester workshop, 2026-07-13 to 2026-07-19
6 booked, 3 completed, 1 rebooked, 2 awaiting parts.
  WS-2211 — brake-bleed, waiting 6 days for BRK-1180
```

WS-2212 has been waiting five days and does not appear. `STALLED_AFTER_DAYS`
is where that line sits — a value somebody can dispute in review, and the most
valuable thing this rewrite produced. Nothing equivalent exists in the looped
version, where the cut-off lives only as a tendency and shifts week to week.

`weekly-report.test.ts` has no counterpart on the agent side, because there is
nothing numeric there to assert against.

## The tool that is not on the surface

The agent version's obvious fourth tool is `send_email`, and it is not here.
An email has already reached a person outside the building and there is no
undo, which puts it on the top rung of chapter 8's ladder; chapter 13's own
"what rules one out" section names an unattended batch with `send_email` on
the surface as a thing that rules a loop out. So both versions of this report
end the same way — the caller sends the finished text, once, from a scheduled
entry — and the only thing that differs between them is who chose the
sequence, which is the one variable this chapter is about.

That also keeps the runnable version honest: every tool `report-agent.ts` can
reach is a read, so an unattended loop left in a repository is bounded by
chapter 9's ceilings and by nothing else.
