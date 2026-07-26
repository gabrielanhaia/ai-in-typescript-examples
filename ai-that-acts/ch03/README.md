# ch03 — The contract: Zod schemas between model and code

One declaration feeding three things: the JSON Schema the provider receives,
an inferred type for the compiler, and a runtime check at the single point
where a request turns into a call.

| File | What it does | Needs |
|---|---|---|
| [`schema.ts`](schema.ts) | `RefundInput`. An identifier, a bounded number, a closed set, and something optional. | — |
| [`print-json-schema.ts`](print-json-schema.ts) | Prints what the model actually receives. The chapter default. | — |
| [`define-tool.ts`](define-tool.ts) | Twenty-three lines holding the whole contract: types in, a runtime check on the far side. | — |
| [`toolbox.ts`](toolbox.ts) | `execute`, which never throws, and the two-tool registry `ch04` imports. | — |
| [`orders.ts`](orders.ts) | The running app's data layer. `issueRefund` is printed; the rows behind it are a fixture. | — |
| [`toolbox.test.ts`](toolbox.test.ts) | Three tests: a valid call, a schema rejection, an unknown tool. In `npm run verify`. | — |

## Run it

```bash
npm run run-example -- ch03
npm test -- ch03
```

## Expected output

`print-json-schema.ts` prints the 2020-12 JSON Schema for `RefundInput`. Four
things in it are worth finding with your own eyes: `required` lists three
fields and not four, `additionalProperties: false` appears without being
asked for, every `.describe()` has become a `description` beside the type,
and `amount_cents` has grown a `maximum` of `9007199254740991` that nobody
wrote. The schema you send is not literally the schema you typed.

The tests pass in milliseconds with no key and no running service. The middle
one is the one to read: the failure comes back as
`Those arguments are not valid — amount_cents: …`, which is prompt, not a log
line.
