# ch14 — The finished chatbot

Thirteen chapters, assembled. Two front ends — a terminal loop and an HTTP server
— over one `answer()` function, with every number that changes when the model
changes living in one file.

## Run it

```bash
docker compose run ai-that-answers ch14                            # the CLI
docker compose run --service-ports ai-that-answers ch14/src/server # the web UI
# then open http://localhost:8787
```

Locally, from `ai-that-answers/`:

```bash
npm run run-example -- ch14
npm run run-example -- ch14/src/server
npm test                            # config.test.ts, no network
```

## The shape

```
ch14/
├─ public/
│  └─ index.html            the browser page from chapter 8
└─ src/
   ├─ config.ts             every number that changes when the model does
   ├─ model.ts              the seam: one string names the provider
   ├─ prompt/system.ts      the system prompt from chapter 4, byte-stable
   ├─ history.ts            the sliding window from chapters 3 and 11
   ├─ answer.ts             one turn: stream, assemble, classify, trim
   ├─ finish.ts             stop_reason before content, from chapter 12
   ├─ deadlines.ts          first-token and idle deadlines, chapter 12
   ├─ provider-options.ts   the marked escape hatch
   ├─ count.ts              token counting, chapter 10
   ├─ cost.ts               rates and arithmetic, chapter 11
   ├─ triage.ts             the Zod schema and typed output, chapter 9
   ├─ server.ts             Hono and SSE, chapter 8
   ├─ cli.ts                the terminal loop, chapter 7
   └─ config.test.ts        five tests, no network, milliseconds
```

This directory is a **self-contained snapshot**: it imports nothing from the other
chapter directories, so you can copy it out and it still runs. That is why
`finish.ts` carries its own `stopReason` rather than importing chapter 7's.

## Expected output

The CLI:

```
you> my rear brake feels spongy

bot> Spongy brakes almost always mean air in the hydraulic line or ...
[claude-haiku-4-5] NNN in / NNN out = $0.000NNN at 2026-07-25 rates
```

The cost line goes to **standard error**, so it is visible in the terminal and
absent from anything you pipe. Six fields are logged per call, and the two people
leave out are the two that matter later: **the model ID**, because a log that
assumes one model cannot answer "which model produced this", and **the rate
date**, because a cost computed with last quarter's constants gets quoted back at
you as though it were current.

Ctrl-C during an answer prints ` [stopped]` and returns you to the prompt. An
answer that hits the output cap prints ` [cut off: output_cap]` — the truncation
is named rather than silently stored as a complete answer.

The server prints `listening on http://localhost:8787`. The page POSTs once to
`/session`, then streams every turn over `GET /chat/:id`, so the conversation
survives across questions in one process.

`npm test` runs the five unit tests:

```
 ✓ ch14/src/config.test.ts (5 tests)
```

**The third is the one worth understanding.** Change `MODEL.model` to
`claude-sonnet-5` and `acceptsSampling` to `false` while leaving `SAMPLING` as it
is, and the suite fails:

```
× no sampling parameter is sent to a model that rejects it
  AssertionError: expected [ 'temperature' ] to deeply equal []
```

One config edit, made for a good reason, and every request in production starts
failing on a parameter set in a different file. The test turns that into a red
build in milliseconds, offline. It works only because `SAMPLING` and
`MODEL.acceptsSampling` are two separate assertions that can disagree — compute
either one from the other and the test proves nothing.

## Am I locked in?

`model.ts` reaches the model through `initChatModel`, so the provider is one
string in one config module. Change `MODEL.provider` and run the CLI again:

```
provider: "anthropic"        → ChatAnthropic, claude-haiku-4-5
provider: "bedrock"          → Error: Unable to import @langchain/aws.
                               Please install with `npm install @langchain/aws`
provider: "google-vertexai"  → Error: Unable to import @langchain/google-vertexai.
                               Please install with `npm install @langchain/google-vertexai`
```

Read what those errors are: `npm install <package>`. Nothing above the seam
objected — the app compiled, booted, and got as far as looking up a binding. It
also stopped at boot rather than on someone's first request. This repo installs
neither binding on purpose; the point is that you can see where the door is.

`provider-options.ts` is the honest cost of that seam. `cache_control` exists on
`ChatAnthropic`'s call options and not on the shared interface, so passing it
through `initChatModel` does not typecheck:

```
error TS2353: Object literal may only specify known properties, and
'cache_control' does not exist in type 'ConfigurableChatModelCallOptions'.
```

The option is forwarded and arrives on the request; only the shared type refuses
it, because it is the intersection of what every provider supports.
`providerOnly()` is a cast that documents itself: `grep providerOnly` lists
exactly what a provider change would have to touch.
