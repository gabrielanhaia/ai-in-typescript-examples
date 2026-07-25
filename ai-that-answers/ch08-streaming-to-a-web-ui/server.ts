import { readFile } from "node:fs/promises";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

const app = new Hono();

app.get("/", async (c) => {
  // The book prints readFile("ch08/index.html"); resolving against import.meta.url
  // means the server does not care which directory you started it from.
  return c.html(await readFile(new URL("index.html", import.meta.url), "utf8"));
});

app.get("/chat", (c) => {
  const question = c.req.query("q") ?? "";
  if (question.trim() === "") {
    return c.text("missing q", 400);
  }

  return streamSSE(c, async (stream) => {
    const controller = new AbortController();

    stream.onAbort(() => {
      console.log("client left; cancelling upstream");
      controller.abort();
    });

    const messages = [
      new SystemMessage("Explain plainly. No lists."),
      new HumanMessage(question),
    ];

    try {
      const upstream = await model.stream(messages, {
        signal: controller.signal,
      });

      for await (const chunk of upstream) {
        if (chunk.text.length === 0) continue;
        process.stdout.write(".");
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
  });
});

serve({ fetch: app.fetch, port: 8787 }, (info) => {
  console.log(`listening on http://localhost:${info.port}`);
});
