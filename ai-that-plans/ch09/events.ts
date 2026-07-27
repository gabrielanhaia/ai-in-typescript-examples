// ch09/events.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { assistant } from "./graph.js";
import { frame, openStream } from "./sse.js";
import { subscribe, unsubscribe } from "./hub.js";

export async function events(
  req: IncomingMessage,
  res: ServerResponse,
  thread: string,
): Promise<void> {
  openStream(res);
  subscribe(thread, res);
  req.on("close", () => unsubscribe(thread, res));

  // Catch-up frame. The thread's checkpoint is the only record
  // of this run that survived whatever just happened.
  const at = await assistant.getState({
    configurable: { thread_id: thread },
  });
  res.write(
    frame("snapshot", { cursor: at.values.cursor ?? 0, next: at.next }),
  );
}
