---
doc_id: OPS-ORD-006
title: Order lifecycle and statuses
owner: Fulfilment
status: current
effective: 2026-02-15
review_due: 2027-02-15
---

# Order lifecycle and statuses

What each status in the order system means, who moves it, and what a customer
sees. Support staff should use these words with customers rather than
improvising, because a customer who has been told "it's being processed" and
then reads "awaiting stock" has been told two different things by the same
company.

## The statuses

| Status | Set by | Customer sees | Means |
|---|---|---|---|
| `received` | checkout | Order received | Payment authorised, not yet paid |
| `paid` | payment processor | Order confirmed | Funds captured; the order enters the pick queue |
| `held-verification` | fraud rules | Order on hold | Over £400 to a non-billing address; a call is due |
| `held-stock` | stock system | Awaiting stock | One or more lines short at pick |
| `picking` | goods in | Being prepared | On a picker's list |
| `packed` | goods in | Being prepared | Boxed, labelled, waiting for the carrier |
| `dispatched` | carrier scan | Dispatched | Carrier has it; tracking is live |
| `delivered` | carrier scan | Delivered | Carrier has recorded delivery |
| `collection-ready` | workshop | Ready to collect | At the workshop counter, held fourteen days |
| `cancelled` | support or customer | Cancelled | No goods shipped; refund due |
| `returned` | returns desk | Return received | Graded, refund authorised or escalated |
| `closed` | nightly job | (nothing) | Ninety days after delivery with no open ticket |

## Ordering in the pick queue

The pick queue is ordered by the time the order reached `paid`, not by the time
the customer clicked buy. An order held for verification loses its place only
for the duration of the hold; when it is released it goes back in at its
original payment time rather than at the back.

Trade orders sit in the same queue as retail orders. There is no priority in
either direction and there never has been, whatever a customer has been told.

## Short lines

A line that cannot be picked puts the whole order into `held-stock`. Fulfilment
then chooses one of three things, and tells the customer which:

1. **Split the order.** Ship what is available now and the rest when it lands.
   No extra delivery charge. This is the default when the missing line is more
   than three days out.
2. **Hold the order.** Ship everything together when the stock arrives. Chosen
   when the missing line is due within three days.
3. **Cancel the line.** Refund it and ship the rest. Chosen when there is no
   arrival date.

We never substitute a different part for a short line, and we never guess an
arrival date. "We do not have a date" is an acceptable thing to say and an
invented date is not.

## Cancellation

A customer can cancel any time before `picking`. Between `picking` and
`dispatched` we will try, and we will be honest that we may not catch it. After
`dispatched` it is a return, and the returns policy applies.

An order cancelled before dispatch is refunded in full including delivery,
within five working days.

## What the customer is emailed

Order confirmation at `paid`. Dispatch confirmation with tracking at
`dispatched`. A collection-ready email at `collection-ready`, followed by a
reminder on day seven and a final one on day thirteen.

Nothing is emailed at `picking`, `packed` or `closed`. A customer who asks why
they got no email between confirmation and dispatch has found the answer, not a
bug.

## Status is not a promise

A status describes where an order is, not when it will arrive. Delivery
estimates come from the shipping policy and from the carrier, and a support
reply should quote the estimate rather than reading a date off the status
screen.
