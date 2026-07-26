# app — the Braxby Cycles service

**Not listings from the book**, except the two route handlers marked below.
This is the service behind the tool surface. It is here so that every
state-changing example has a target that is both genuine and inert.

All of it is fabricated. No example anywhere in this directory can touch a
live account, a payment processor or anybody's mailbox.

## Run it

```bash
docker compose up -d          # in ai-that-acts/
```

or, on your own Node, in a second terminal:

```bash
npm run app
npm run app:seed -- --force   # put the shop's data back the way it was
```

It listens on `http://localhost:8788`, which is the value `BRAXBY_API_URL`
falls back to and the port chapter 7 prints in its `connect ECONNREFUSED`
example.

## What is in it

| File | What it is |
|---|---|
| `server.ts` | Hono, four route groups, and the log line chapter 6 asks for. |
| `db.ts` | The schema. Node 24 ships a SQLite driver, so there is no second container and no dependency. |
| `seed.ts` | The shop's data. ORD-4471 is the workshop-built rear wheel, £89.00, dispatched with Evri. |
| `store.ts` | The queries. `loadOrder` and `findByKey` are named in chapter 6's and chapter 7's listings. |
| `workshop.ts` | The diary. Chapter 13 reads it with no model anywhere near it. |
| [`orders/routes.ts`](orders/routes.ts) | **`/api/orders/:id` is printed in chapter 6, verbatim.** The list and items endpoints beside it are not. |
| [`refunds/routes.ts`](refunds/routes.ts) | **Printed in chapter 7, verbatim.** |
| `workshop/routes.ts` | The diary's slots and bookings. |
| `stock/routes.ts` | One part, one row, no filter language. |

## The two properties the book leans on

**Scoping happens in SQL, not in a post-filter.** Another customer's row is
never loaded in the first place. And an order that is real but not theirs
answers **404 rather than 403**, so the response cannot be used to probe which
order numbers exist.

**`idempotency_key` is uniquely indexed.** `refunds_by_key` in `db.ts` is what
chapter 7 depends on. An in-process dictionary would satisfy every test in
this repository and then break the moment a second copy of the service runs.

```bash
curl -X POST localhost:8788/api/refunds \
  -H 'authorization: Bearer t' -H 'content-type: application/json' \
  -H 'idempotency-key: toolu_demo' \
  -d '{"order_id":"ORD-4471","amount_cents":8900,"reason":"damaged"}'
```

Run that twice. The second answer carries the first refund's id and
`"repeat": true`.

## Authentication, honestly

`customerFromToken` accepts **any** bearer token and answers as the shop's one
demo customer, so that no listing in this book needs a credential a reader has
to go and mint. A missing header is still a 401, which is the branch chapter
6's handler prints. A production one would check a signature and pull a subject
out of it, which is the point of the rule: who the caller is arrives with the
inbound request, not from anything the model filled in.

The database file lands in `data/braxby.sqlite`, which is git-ignored.
