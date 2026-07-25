// Times the built-in retry behaviour against a local server that always returns
// 500. No request leaves the machine; ANTHROPIC_API_KEY still has to be set,
// because the client constructor requires one before any request is made.
import { createServer } from "node:http";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "langchain";

const at: number[] = [];

const server = createServer((_req, res) => {
  at.push(Date.now());
  res.writeHead(500, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      type: "error",
      error: { type: "api_error", message: "Internal server error" },
    }),
  );
});

await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address() as { port: number };

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 16,
  clientOptions: { baseURL: `http://127.0.0.1:${port}` },
});

const started = Date.now();
try {
  await model.invoke([new HumanMessage("hi")]);
} catch {
  const gaps = at.slice(1).map((t, i) => t - at[i]!);
  console.log(`attempts=${at.length} gaps=${gaps} total=${Date.now() - started}ms`);
} finally {
  server.close();
}
