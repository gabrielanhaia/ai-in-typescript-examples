# ch01 — What an LLM call actually is

The same call written twice: once against the provider's own client library, once
through the framework the rest of the book uses. Plus the four lines that produce
the illusion of memory.

## Run it

```bash
docker compose run ai-that-answers ch01                 # from the repo root
docker compose run ai-that-answers ch01/raw-sdk-call
docker compose run ai-that-answers ch01/no-memory
```

Locally, from `ai-that-answers/`: `npm run run-example -- ch01`.

| File | What it does | Needs a key |
|---|---|---|
| `framework-call.ts` | The same call through `ChatAnthropic`. The chapter default. | yes |
| `raw-sdk-call.ts` | One `messages.create` against `@anthropic-ai/sdk`. | yes |
| `no-memory.ts` | Builds a history array, sends it, appends the reply. | yes |

## Expected output

`framework-call.ts` and `no-memory.ts` print one short paragraph defining a
monorepo — plain text, no list, no preamble. `no-memory.ts` then prints
`[history is now 3 messages long]`: system, question, answer.

`raw-sdk-call.ts` prints the raw `content` array rather than a string, because
that is what the SDK returns:

```
[ { type: 'text', text: 'A monorepo is a single repository that ...' } ]
```

The wording differs on every run. The shape does not — one object, `type:
'text'`, one `text` field. That the framework version prints a string and the SDK
version prints an array is the whole point of running both.
