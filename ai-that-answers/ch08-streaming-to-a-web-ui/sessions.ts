// EventSource cannot send a body, so the question is POSTed and the stream is
// opened by ID. streamAnswer is server.ts's handler body, extracted verbatim.
//
// Known limits, left in deliberately: the Map lives in one process, so it does
// not survive a restart or a second instance, and a session ID is never
// consumed, so a leaked URL replays someone else's conversation.
import { readFile } from "node:fs/promises";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { SSEStreamingApi } from "hono/streaming";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import type { BaseMessage } from "@langchain/core/messages";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

async function streamAnswer(
  stream: SSEStreamingApi,
  messages: BaseMessage[],
): Promise<void> {
  const controller = new AbortController();

  stream.onAbort(() => {
    console.log("client left; cancelling upstream");
    controller.abort();
  });

  try {
    const upstream = await model.stream(messages, {
      signal: controller.signal,
    });

    for await (const chunk of upstream) {
      if (chunk.text.length === 0) continue;
      await stream.writeSSE({
        event: "token",
        data: JSON.stringify({ text: chunk.text }),
      });
    }

    await stream.writeSSE({ event: "done", data: "ok" });
  } catch (error) {
    if (controller.signal.aborted) return;
    console.error(error);
    await stream.writeSSE({
      event: "failed",
      data: "the answer stopped early",
    });
  }
}

const sessions = new Map<string, BaseMessage[]>();
const app = new Hono();

app.get("/", async (c) =>
  c.html(await readFile(new URL("sessions.html", import.meta.url), "utf8")),
);

app.post("/session", async (c) => {
  const body = await c.req.json<{ question: string }>();
  const id = crypto.randomUUID();

  sessions.set(id, [
    new SystemMessage("Explain plainly. No lists."),
    new HumanMessage(body.question),
  ]);

  return c.json({ id });
});

app.get("/chat/:id", (c) => {
  const messages = sessions.get(c.req.param("id"));
  if (messages === undefined) {
    return c.text("no such session", 404);
  }
  return streamSSE(c, (stream) => streamAnswer(stream, messages));
});

// The EventSource-free alternative: POST the question, read the response body
// yourself. Plain text on the wire, no event framing.
app.post("/chat", async (c) => {
  const body = await c.req.json<{ question: string }>();

  const upstream = await model.stream([
    new SystemMessage("Explain plainly. No lists."),
    new HumanMessage(body.question),
  ]);

  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        for await (const chunk of upstream) {
          if (chunk.text.length > 0) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
        controller.close();
      },
    }),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
});

serve({ fetch: app.fetch, port: 8788 }, (info) => {
  console.log(`listening on http://localhost:${info.port}`);
});
