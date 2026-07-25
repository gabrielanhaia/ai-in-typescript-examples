import { readFile } from "node:fs/promises";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { BaseMessage } from "langchain";
import { answer } from "./answer.js";
import { newConversation } from "./history.js";

const conversations = new Map<string, BaseMessage[]>();
const app = new Hono();

const page = new URL("../public/index.html", import.meta.url);

app.get("/", async (c) => c.html(await readFile(page, "utf8")));

app.post("/session", async (c) => {
  const id = crypto.randomUUID();
  conversations.set(id, newConversation());
  return c.json({ id });
});

app.get("/chat/:id", (c) => {
  const id = c.req.param("id");
  const history = conversations.get(id);
  const question = c.req.query("q") ?? "";

  if (history === undefined) return c.text("no such conversation", 404);
  if (question.trim() === "") return c.text("missing q", 400);

  return streamSSE(c, async (stream) => {
    const controller = new AbortController();
    stream.onAbort(() => controller.abort());

    try {
      const turn = await answer(
        history,
        question,
        (text) =>
          void stream.writeSSE({
            event: "token",
            data: JSON.stringify({ text }),
          }),
        controller.signal,
      );

      conversations.set(id, turn.history);
      await stream.writeSSE({ event: "done", data: turn.finish.kind });
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      await stream.writeSSE({
        event: "failed",
        data: "the answer stopped early",
      });
    }
  });
});

serve({ fetch: app.fetch, port: 8787 }, (info) => {
  console.log(`listening on http://localhost:${info.port}`);
});
