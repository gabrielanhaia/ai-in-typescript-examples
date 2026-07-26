# ch11 — MCP: reuse tools instead of rewriting them

Four moving parts: a client, a server, a channel between them, and asking at
run time what exists — which nothing earlier in the book has to do, since the
list arrives from another process.

Pinned to `@modelcontextprotocol/sdk@1.29.0`. The revision agreed at
connection is `2025-11-25`, taken from the `LATEST_PROTOCOL_VERSION` constant
in the installed package rather than from any document.

| File | What it does | Needs |
|---|---|---|
| [`connect.ts`](connect.ts) | Four lines of protocol: identify, handshake, `listTools`. | — |
| [`register.ts`](register.ts) | `asDefinition` — the rename, the dialect crossing, and the fields that do not travel. Plus `registerAll`. | — |
| [`server.ts`](server.ts) | One small MCP server around chapter 3's `findOrder`, imported unchanged. | — |
| [`admit.ts`](admit.ts) | Filters the discovered list down to the tools you have actually reviewed. | — |
| [`call.ts`](call.ts) | The two lines `registerAll` is built around. | — |
| `round-trip.ts` | **Not from the book.** The chapter's "Run the pair", as one command. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch11
```

It spawns `server.ts` as a child process over stdio. **No key, no network, no
container.**

## Expected output

```text
server: {"name":"braxby-orders","version":"1.0.0"}
capabilities: {"tools":{"listChanged":true}}
latest revision the SDK speaks: 2025-11-25
it also speaks: 2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05, 2024-10-07
instructions: undefined
```

Then the discovered tool as MCP sends it, the converted one as it goes on the
request, and the whole lesson in two lines:

```text
  MCP:      http://json-schema.org/draft-07/schema#
  provider: https://json-schema.org/draft/2020-12/schema
```

Taking a discovered tool onto a request changes the schema dialect as well as
the field name. Notice what is dropped on the way, too: `annotations` and
`execution` belong to the protocol and have nowhere to go on the provider's
type.

Then a call, and the two failures the chapter tells you to cause on purpose. A
tool that throws and a tool that does not exist both come back as a **resolved
promise** with `isError` on it:

```text
{"content":[{"type":"text","text":"MCP error -32602: Tool no_such_tool not found"}],"isError":true}
```

Code written on the assumption that an unknown name raises has a defect that
only appears once the model invents one. `registerAll` inspects the flag and
raises itself, which puts the failure back on chapter 7's path.

`instructions: undefined` because this server supplies none. A third party's
might, and it is free text intended for your prompt — read it, decide, and
write your own clause rather than forwarding theirs.
