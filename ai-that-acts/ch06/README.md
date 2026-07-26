# ch06 — Wiring the loop to real APIs

The tools stop reading fixtures and start calling the Braxby service in
[`../app`](../app): a deadline on every call, the identity in a context rather
than in a schema, and a projection at the boundary.

| File | What it does | Needs |
|---|---|---|
| [`context.ts`](context.ts) | `ToolContext` — the customer, the token, the run's signal. Arrives by closure, never as an argument. | — |
| [`toolbox.ts`](toolbox.ts) | The six-tool surface. `get_order_status` is the printed one; the other five are chapter 5's table. | — |
| [`session.ts`](session.ts) | The two things the loop needs, derived once per request. | — |
| [`api.ts`](api.ts) | `apiGet` and `apiPost`: a per-call deadline composed with the run's signal, and the two headers that make the logs join up. | service |
| [`summarise.ts`](summarise.ts) | An allowlist projection. A field the orders service grows one day is a field this ignores. | — |
| [`book-slot.ts`](book-slot.ts) | The first tool that changes something. The `slot_id` is an argument the model cannot invent. | service |
| [`identity-antipattern.ts`](identity-antipattern.ts) | The schema to never write. Nothing imports it. | — |
| [`toolbox.test.ts`](toolbox.test.ts) | Two tests, no key, **service required**. In `npm run test:live`. | service |
| `run-examples.ts` | **Not from the book.** Prints the surface and the property no single listing shows. The chapter default. | — |

## Run it

```bash
docker compose up -d          # or: npm run app, in a second terminal
npm run run-example -- ch06
npm run test:live
```

## Expected output

`run-examples.ts` prints six tool names and then:

```text
two customers, two tokens, definitions byte-identical: true
```

That is the cache property chapter 5 asked for, checked: `ctx` appears in the
closure and never in the definition, so a surface assembled per request still
serialises identically.

Both live tests make assertions about sentences, which reads oddly until you
remember what the model is given. One confirms a 404 arrives as usable advice
naming the alternative tool; the other confirms a badly typed value is stopped
by the parse and never turns into a request.

## Where this differs from the page

The chapter prints one tool. Chapter 5's table settles the surface at six and
chapter 12 says it goes from six to seven, so all six are here, written in the
shape of the printed one. `toolboxFor` also takes an optional second argument,
the run id, because `bookSlot(ctx, runId)` needs one and the printed
`toolboxFor(ctx)` has nowhere to get it.

The six-tool surface has **no diary-read tool on it**, so there is nowhere for
the model to learn a `slot_id` from. `book_workshop_slot` therefore appends
the free slots to its own failure sentence, which is the cheapest repair
available without adding a seventh tool the book does not have.
