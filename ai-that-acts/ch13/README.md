# ch13 — When an agent is the wrong answer

The same job written twice: once as a loop, once as ordinary code with a model
call in it.

| File | What it does | Needs |
|---|---|---|
| [`weekly-report.ts`](weekly-report.ts) | The version that should ship. Every count counted, and the threshold is a constant. | — |
| [`covering-note.ts`](covering-note.ts) | One model call, not a loop. Facts in, phrasing out, and a truncated note falls back to the figures. | key |
| [`weekly-report.test.ts`](weekly-report.test.ts) | The boundary case at exactly the threshold. In `npm run verify`. | — |
| [`report-agent.ts`](report-agent.ts) | Built as a loop, for comparison rather than for production. Spends tokens. | key + service |
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

## Where this differs from the page

The chapter tables a four-tool surface for the agent version: `list_bookings`,
`get_booking`, `find_orders` and `send_email`. Two of those do not exist in
this repository, and `send_email` is the one that cannot be undone — the book
puts external side effects at the top of chapter 8's ladder and argues they
should usually not be on a surface at all. So `report-agent.ts` runs the
brief, the nightly ceilings and the loop against the surface the application
actually has. The step count still moves week to week, which is the chapter's
point.
