# ch13 — When not to use an LLM

Six functions, none of which calls a model, and all of which are the right answer
to a question somebody wanted to send to one.

## Run it

```bash
docker compose run ai-that-answers ch13          # no key needed
```

Locally, from `ai-that-answers/`: `npm run run-example -- ch13`.

| File | What it does | Needs a key |
|---|---|---|
| `run-examples.ts` | Driver that calls each function below. **Not a listing from the book.** The chapter default. | no |
| `total.ts` | Arithmetic, and anything involving money. | no |
| `part-number.ts` | Format validation against a written spec. A regex *decides*; a model *opines*. | no |
| `route.ts` | Deterministic routing from a lookup table. | no |
| `shipping.ts` | The worked example: banded shipping cost, fifteen lines. | no |
| `catalogue.ts` | The something-you-hold that `verify.ts` checks against. | no |
| `verify.ts` | Check the model's answer against your own data. | no |
| `spans.ts` | Ask it to quote, then verify the quote is really in the source. | no |

## Expected output

No key, no network, and identical on every machine — which is the chapter's whole
argument:

```
totalPence       2048
isPartNumber     true false
ownerOf          payments
shippingPence    399 699 1199
checkedPart      BRK-1180 null
verifiedSpan     closes on 14 august
verifiedSpan     null
```

Reading it line by line: `totalPence` is 2 × 399 + 1,250 in integer pence, exact
by construction. `isPartNumber` accepts `BRK-1180` and rejects `brk-118`.
`shippingPence` returns the three bands for 500 g, 5 kg and 20 kg.
`checkedPart` passes a part that is in the catalogue and returns `null` for one
that is not — a plausible-looking fabrication does not survive the lookup.
`verifiedSpan` accepts a quote that really is in the source despite different
casing and collapsed whitespace, and returns `null` for one that changed a date.

Every one of those is a decision. A model would have given an opinion, at a
hundred times the latency and a cost per call, and would occasionally have been
wrong in a way no test would catch.
