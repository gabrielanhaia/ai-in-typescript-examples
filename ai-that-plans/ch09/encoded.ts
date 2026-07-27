// ch09/encoded.ts
import type { ServerResponse } from "node:http";
import { assistant } from "./graph.js";
import { openStream } from "./sse.js";

export async function pipeRun(res: ServerResponse, id: string) {
  const stream = await assistant.stream(null, {
    configurable: { thread_id: id },
    streamMode: ["updates", "custom"],
    encoding: "text/event-stream",
  });
  openStream(res);
  // Already `event: updates\ndata: {...}\n\n`, as bytes.
  for await (const bytes of stream) res.write(bytes);
  res.end();
}
