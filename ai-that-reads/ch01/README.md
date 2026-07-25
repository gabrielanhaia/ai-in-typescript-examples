# Chapter 1 — Confidently wrong

The two calls that frame the book: one with no document behind it, one with the document pasted in.

| File | What it does |
|---|---|
| [`ungrounded.ts`](ungrounded.ts) | Asks about the Braxby warranty with nothing retrieved. The answer is fluent and invented. |
| [`grounded.ts`](grounded.ts) | The same question with a policy file read off disk and wrapped in `<source>` tags, under an answer contract. |

## Run it

Both call the answering model, so both need `ANTHROPIC_API_KEY`.

```bash
npm run run-example -- ch01
npm run run-example -- ch01/grounded corpus/markdown/warranty-policy.md
```

`grounded.ts` takes the path as its one argument and throws a usage error without it. Point it at a file that does *not* contain the answer and watch the contract fire:

```bash
npm run run-example -- ch01/grounded corpus/markdown/shipping-and-delivery.md
```

## Expected output

`ungrounded.ts` prints three plausible paragraphs about frame warranties. Open [`corpus/markdown/warranty-policy.md`](../corpus/markdown/warranty-policy.md) beside it and compare — the term and the transfer rule will usually both be wrong, delivered with the same confidence as if both had been right.

`grounded.ts`, pointed at the warranty policy, prints a short, specific, dull answer that matches the file. Pointed at the shipping policy it prints, near enough verbatim:

```text
I don't have that in the documents I can see.
```

That contrast is the whole book in two commands.

## Notes

- No sampling parameter is sent. `claude-sonnet-5` returns a 400 for a non-default `temperature`, `top_p` or `top_k`, and the answer contract is what does the grounding anyway.
- `CONTRACT` in `grounded.ts` is deliberately blunt. Chapter 10 writes the real one.
