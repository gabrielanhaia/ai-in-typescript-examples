# ch09 — Structured output with Zod

One schema declared once, giving you a runtime validator and a TypeScript type,
and one method call that turns it into a shape the provider will honour.

## Run it

```bash
docker compose run ai-that-answers ch09
docker compose run ai-that-answers ch09/print-json-schema
```

Locally, from `ai-that-answers/`:

```bash
npm run run-example -- ch09
npm run run-example -- ch09 "I was charged twice and the export button does nothing."
npm test                              # schema.test.ts, no key, milliseconds
```

| File | What it does | Needs a key |
|---|---|---|
| `triage.ts` | Classifies a ticket into the typed schema. The chapter default. | yes |
| `schema.ts` | The `Triage` schema: flat, enums not strings, `.describe()` on every field. | no |
| `print-json-schema.ts` | Prints what the provider actually receives. | no |
| `methods.ts` | The two strategies, `functionCalling` and `jsonSchema`. | no |
| `bad-and-good.ts` | The same information, badly and well. | no |
| `actions.ts` | The case that genuinely needs nesting: a list of things with the same fields. | no |
| `validation-failure.ts` | Both survival modes: catching `OutputParserException`, and `includeRaw`. | yes |
| `store.ts` | Validating again at your own boundary. | no |
| `schema.test.ts` | Two tests that never touch the model. | no |

## Expected output

`triage.ts` prints four lines — the enum, the enum, the sentence, the area:

```
billing
high
Customer was charged twice for the October invoice and the export button fails.
reports
```

`category` and `urgency` can only ever be values from their enums; that is
enforced twice, once by the provider and once by Zod on the way back.

`print-json-schema.ts` needs no key and prints the same JSON Schema every time —
`enum` arrays for the two enums, `maxLength: 200` on the summary, an `anyOf` with
`null` for the nullable field, all four names in `required`, and
`additionalProperties: false`.

`schema.test.ts` runs inside `npm test`:

```
 ✓ ch09-structured-output-with-zod/schema.test.ts (2 tests)
```

The second of those is the one worth understanding: a missing `productArea`
fails, because `.nullable()` means "may be null", not "may be absent". Optional
and nullable are different, and only one of them is what you want here.
