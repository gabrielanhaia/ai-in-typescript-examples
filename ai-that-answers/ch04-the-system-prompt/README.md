# ch04 — The system prompt

The block at the front of every request, built the way it scales past a demo: a
constant in its own module, no interpolation in it, per-conversation context in
the first user turn instead.

## Run it

```bash
docker compose run ai-that-answers ch04
docker compose run ai-that-answers ch04/assembled-prompt-antipattern
```

Locally, from `ai-that-answers/`:

```bash
npm run run-example -- ch04
npm run run-example -- ch04 "Do you sell 12-speed cassettes for a 2019 frame?"
```

| File | What it does | Needs a key |
|---|---|---|
| `ask.ts` | Sends one question under the whole system prompt. The chapter default. | yes |
| `chat.ts` | `ask()` and `openConversation()`. Imported by `ask.ts`. | yes |
| `prompt/system.ts` | The system prompt, as a constant, byte-stable. | no |
| `prompt/index.ts` | Picks between whole prompts by key rather than assembling fragments. | no |
| `prompt/system.en.ts`, `prompt/system.de.ts` | Two whole prompts, edited and versioned as units. | no |
| `assembled-prompt-antipattern.ts` | The pattern not to use, kept runnable so you can count what it emits. | no |

## Expected output

`ask.ts` prints one paragraph of plain prose, under 120 words, with no headings,
no bullets, and no price in it. Ask it about something the shop does not sell and
it should say so in one sentence and offer something it does — that is the "When
you cannot help" section of the prompt doing its job, and it is the two-minute
test worth running before you ship any prompt.

`assembled-prompt-antipattern.ts` needs no key. It prints the four fragments it
happened to select, then:

```
[this is 1 of 8 prompts this code can emit]
```

Set `TIER=free`, `LOCALE=de` or `REFUSAL_V2=0` and a different one comes out.
That is the problem: nobody can point at the prompt this code actually sends.
