# Chapter 10 — The retrieval prompt

Four regions, always in the same order, and the rules that let the model decline.

| File | What it does |
|---|---|
| [`context.ts`](context.ts) | `contextBlock`: numbered `<source>` tags, and the marker mapping returned alongside the text. |
| [`prompt.ts`](prompt.ts) | `ANSWER_CONTRACT` and `userTurn`. |
| [`answer.ts`](answer.ts) | `generate` on passages somebody else retrieved, and `answer`, the convenience wrapper. |
| [`order.ts`](order.ts) | `edgesFirst` — best first, second-best last, weakest in the middle. |
| [`budget.ts`](budget.ts) | `countPromptTokens`, Book 1's counter pointed at a retrieval prompt. |
| `run-examples.ts` | **Not from the book.** The assembled prompt and the four checks, keyless. |

## Run it

Keyless:

```bash
npm run run-example -- ch10
```

The generation half needs all four credentials and an ingested corpus. `budget.ts` needs only `ANTHROPIC_API_KEY` — `countTokens` generates nothing and is not billed.

```bash
npm run run-example -- ch10/answer
```

## Expected output

The assembled prompt, in full, followed by:

```text
the four checks

  ok    every chunk appears exactly once  (1, 1)
  ok    markers unique and sequential from 1  (1, 2)
  ok    open and close tags balance  (2 open, 2 close)
  ok    prompt under budget  (1398 of 24000 characters)

the same checks, on a chunk that contains the delimiter

  FAIL  open and close tags balance  (3 open, 4 close)
```

That last one fails on purpose. A document containing `</source>` is a document, and your loader will index it. `context.ts` does not escape chunk content — deliberately, and the chapter says to make that decision rather than leave it undecided. This check is how you find out you decided wrong.

Then `edgesFirst([1,2,3,4,5])` → `1, 3, 5, 4, 2`.

## Notes

- **Print the prompt before you tune anything.** Half a sentence at the top of a chunk, a table whose header row went elsewhere, a passage that is about the right subject and answers nothing, the same text twice under two markers: all four jump out of the assembled string, and none of them can be seen from the answer the model wrote.
- **No sampling parameter is sent.** `claude-sonnet-5` returns a 400 for a non-default `temperature`, `top_p` or `top_k`. It would not have helped anyway: a model at temperature zero invents the *same* VAT number every time.
- **The contract goes in the system block**, not the user turn. It is the only stable prefix in a retrieval prompt, and it is the only part that can cache. Sonnet 5's minimum cacheable prefix is 1,024 tokens; a contract shorter than that does not cache, silently.
- The exact refusal string — `I don't know from the documents I have.` — is a constant so your code can match on it. Chapter 11 uses it to tell a refusal from a contract violation, and chapter 12 counts it. Put a test on the string before somebody improves the wording.
- `budget.ts` calls the provider's `messages.countTokens`. The framework's `getNumTokens` divides the character count by four and mentions it on stderr, which is the least useful way to be wrong about a figure you are about to size a budget from.
