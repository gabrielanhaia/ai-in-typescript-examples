# ch07 — Streaming to a terminal

`.invoke()` returns one value at the end; `.stream()` returns many as they
arrive. Everything else in this chapter is about assembling them correctly.

## Run it

```bash
docker compose run ai-that-answers ch07
docker compose run ai-that-answers ch07/stream-assemble
docker compose run ai-that-answers ch07/utf8-split      # no key needed
docker compose run ai-that-answers ch07/chat
```

Locally, from `ai-that-answers/`: `npm run run-example -- ch07`.

| File | What it does | Needs a key |
|---|---|---|
| `stream-basic.ts` | The smallest version that works. The chapter default. | yes |
| `stream-assemble.ts` | Assembles with `.concat()` and prints the finished chunk's metadata. | yes |
| `stop-reason.ts` | Reads `stop_reason` off a streamed message. Imported by chapter 12. | no |
| `utf8-split.ts` | Splits `café` mid-character to show what `StringDecoder` is for. | no |
| `measure-ttft.ts` | Time to first token, total time, characters. | yes |
| `stream-cancel.ts` | Ctrl-C aborts the upstream request rather than just the loop. | yes |
| `chat.ts` | The chapter-3 loop with the streaming pieces dropped in. | yes |

## Expected output

`stream-basic.ts` writes an explanation of HTTP/2 into the terminal a fragment at
a time, then a newline. The visible property is that text appears within a second
or so and keeps appearing — not that it is fast, but that it is *early*.

`stream-assemble.ts` streams the same answer, then:

```
id:      msg_...
tokens:  { input_tokens: NN, output_tokens: NNN, total_tokens: NNN }
text:    NNNN characters
```

The usage arrives on the bookend chunks, which is why it is read off the
assembled message rather than off any single delta.

`utf8-split.ts` needs no key and prints exactly this, every time:

```
caf��
café
```

Two bytes of `é` split across two buffers become replacement characters when
decoded independently, and the right character when fed through a
`StringDecoder`. The framework already does this for you; the file exists so you
know what it was doing.

`measure-ttft.ts` prints three numbers:

```
ttft    NNN ms
total   NNNN ms
chars   NNNN
```

**No figures are printed here on purpose.** Latency depends on your hardware,
your network and the time of day, so a number from someone else's run is not a
number you can use. The relationship is what matters and it will hold on your
machine: `ttft` is a small fraction of `total`, and it is the one the user
actually feels. Record your own and compare after a change.

`stream-cancel.ts` streams a long answer; press Ctrl-C and it prints
`[cancelled]` and stops. The token count you were billed for is what had already
been generated — cancelling stops future tokens, it does not un-bill past ones.
