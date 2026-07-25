# ch03 — Messages, roles, and the conversation you resend

A chat loop in about twenty lines, the bug in it, and the four things you can do
when resending the whole conversation every turn stops being free.

## Run it

```bash
docker compose run ai-that-answers ch03
docker compose run ai-that-answers ch03/budget-trim
```

Locally, from `ai-that-answers/`: `npm run run-example -- ch03`.
Type a question, press enter. An empty line or `/quit` ends it.

| File | What it does | Needs a key |
|---|---|---|
| `chat.ts` | The chapter's headline loop, printed as it appears in the book. | yes |
| `budget-trim.ts` | The same loop with both corrections: mutate on success, trim against a measured budget. | yes |
| `sliding-window.ts` | Keeps the system prompt and the last *N* turns. Imported, not run. | no |
| `store.ts` | Round-trips a history to plain `{role, text}` objects and back. Imported, not run. | no |

## Expected output

```
you> what is a monorepo?

ai> A monorepo is a single version-control repository that holds ...
   [turn 1 | 2 messages sent | NN in / NN out]

you> when is it the wrong choice?

ai> It is the wrong choice when teams need to ship on independent ...
   [turn 2 | 4 messages sent | NNN in / NN out]
```

The number to watch is `messages sent`. Turn one sends two, turn two sends four,
turn five sends ten. `input_tokens` climbs with it, because the whole
conversation goes over the wire on every turn and you are billed for all of it.

`budget-trim.ts` prints `[turn N | M input tokens]` instead, and once `M` passes
8,000 it prints a trim line:

```
   [over 8000; trimmed to 13 messages]
```

Reaching 8,000 input tokens takes a long conversation or a few pasted stack
traces. Lower `INPUT_BUDGET` in the file if you want to see the branch fire
sooner.
