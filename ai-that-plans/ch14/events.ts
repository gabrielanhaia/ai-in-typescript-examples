// NOT A LISTING FROM CHAPTER 14.
//
// Chapter 9's `ch09/events.ts`, carried forward unchanged. The reconnect path
// reads state rather than history: the checkpointer is the replay log, and
// chapter 5 paid for it already. A fresh thread reports step zero, a thread
// four steps in reports four, and the client does not branch on which case it
// is in.
import type { IncomingMessage, ServerResponse } from "node:http";
import "./env.js";
import { assistant } from "./build.js";
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
