# ch08 — Streaming to a web UI

A Hono server that forwards the model's stream to the browser as Server-Sent
Events, and one HTML file with no framework and no build step.

## Run it

```bash
docker compose run --service-ports ai-that-answers ch08
# then open http://localhost:8787
```

`--service-ports` is required: without it compose does not publish the container's
ports and the browser cannot reach the server.

Locally, from `ai-that-answers/`: `npm run run-example -- ch08`.

| File | What it does | Needs a key |
|---|---|---|
| `server.ts` | `GET /` serves the page, `GET /chat?q=` streams the answer. The chapter default. Port 8787. | yes |
| `index.html` | The page: `EventSource`, buffered painting, scroll-aware append, placeholder. | — |
| `sessions.ts` | POST the conversation, GET the stream — plus a plain-text `POST /chat` for the `EventSource`-free client. Port 8788. | yes |
| `sessions.html` | The page for `sessions.ts`, with both flows on it. | — |

## Expected output

The server prints:

```
listening on http://localhost:8787
```

Type a question in the browser and press Ask. A `…` appears immediately, is
replaced by the first fragment, and the answer fills in as it is written. In the
server's terminal a dot appears per forwarded chunk:

```
....................................
```

Without a browser, `curl` shows the wire format directly:

```bash
curl -N "http://localhost:8787/chat?q=why+is+the+sky+blue"
```

```
event: token
data: {"text":"The"}

event: token
data: {"text":" sky looks"}

event: done
data: ok
```

That is the entire wire format: an `event:` line, a `data:` line, a blank line,
repeat. No framing library, nothing to install.

**The cancellation test.** Ask for something long, then close the browser tab
mid-answer. The server prints `client left; cancelling upstream` and the dots
stop within a second. If they keep going, the abort is not reaching the model
call and you are paying for tokens nobody will read. The scriptable version:

```bash
curl -N "http://localhost:8787/chat?q=explain+TCP+in+detail" &
sleep 1
kill %1
```

`sessions.ts` listens on **8788** so it can run alongside `server.ts`.
