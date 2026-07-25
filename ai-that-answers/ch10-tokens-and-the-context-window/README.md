# ch10 — Tokens and the context window

A token counter you can trust, the framework's counter you cannot, and the two
separate ceilings that fail in two different ways.

## Run it

```bash
docker compose run ai-that-answers ch10
docker compose run ai-that-answers ch10/five-strings
docker compose run ai-that-answers ch10/getnumtokens-trap
```

Locally, from `ai-that-answers/`: `npm run run-example -- ch10`.

Counting is free — `messages.countTokens` generates nothing and is not billed —
so every listing here except `size-cap.ts` and `predicted-vs-billed.ts` costs
nothing but still needs a key to authenticate.

| File | What it does | Needs a key |
|---|---|---|
| `three-ways.ts` | Counts prose, JSON and code and prints chars/token for each. The chapter default. | yes |
| `count.ts` | The counter: framework messages → wire shape → `messages.countTokens`. | yes |
| `count-endpoint.ts` | The endpoint called directly, without the framework. | yes |
| `getnumtokens-trap.ts` | `getNumTokens` beside the real count, so you can see the silent wrong answer. | yes |
| `five-strings.ts` | Five deliberately-chosen short strings, counted side by side. | yes |
| `usage.ts` | `spendOf()` — the four numbers on a response, defaulted rather than assumed. | no |
| `predicted-vs-billed.ts` | Counts a request, sends it, prints both numbers. | yes |
| `headroom.ts` | "Does the history fit *with room for an answer*." | yes |
| `size-cap.ts` | Runs chapter 6's input set and reports the observed output distribution. | yes |
| `samples/` | The three files `three-ways.ts` reads. Excluded from the build. | — |

## Expected output

`three-ways.ts` prints one line per sample, in this shape:

```
prose.txt    1240 chars  NNN tokens  N.NN chars/token
data.json    1096 chars  NNN tokens  N.NN chars/token
code.ts      1426 chars  NNN tokens  N.NN chars/token
```

The character counts are fixed — those three files do not change. **The token
counts are not printed here, because they are a property of the provider's
tokenizer on the day you run it, and this repo does not print numbers it did not
measure on your machine.** What to read is the third column and its ordering:
**prose gets the most characters per token; the same information as JSON gets the
fewest**, because every quote, comma and space of indentation is a token too.
That ordering is why "roughly four characters per token" is a rule of thumb for
English prose and a bad estimate for anything structured.

`five-strings.ts` prints token count, character count, and the string:

```
NN      3 chars "cat"
NN      20 chars        "internationalisation"
NN      36 chars        "550e8400-e29b-41d4-a716-446655440000"
NN      27 chars        "Los tokens no son palabras."
NN      33 chars        "{\n  \"part\": \"chain\",\n  \"qty\": 2\n}"
```

Again, read the *relationships*. `"cat"` is a single common English word and
costs the fewest tokens of the five. `"internationalisation"` is one word and
costs several, because long rare words are assembled from pieces. The UUID has the worst
ratio in the list — random hex offers nothing to compress. The Spanish line costs
more than an English line of the same character count. And nothing here counts as
zero plus its own length: every figure carries the fixed overhead of a message
envelope, which is why `"cat"` does not come back as 1.

`getnumtokens-trap.ts` prints a warning on standard error, then two numbers that
do not agree:

```
Failed to calculate number of tokens, falling back to approximate count
  Error: Unknown model
getNumTokens      8 (text.length / 4, rounded up)
countTokens       NN
```

The first number is exactly `Math.ceil("some text you want to measure".length /
4)` and has nothing to do with the model. That is the failure the chapter is
warning about: no exception, no wrong-looking value, an arithmetic estimate
presented as a measurement. Use `countTokens`.

`predicted-vs-billed.ts` prints two numbers that will be close and not always
identical:

```
NN predicted / NN billed
```

Run it on the prompts you actually send. The size of the gap is how you pick the
margin for `headroom.ts`.
