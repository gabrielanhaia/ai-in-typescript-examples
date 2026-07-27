// ch09/hub.ts
import type { ServerResponse } from "node:http";
import { frame } from "./sse.js";

const subs = new Map<string, Set<ServerResponse>>();

export function subscribe(id: string, res: ServerResponse): void {
  const set = subs.get(id) ?? new Set<ServerResponse>();
  set.add(res);
  subs.set(id, set);
}

export function unsubscribe(id: string, res: ServerResponse): void {
  const set = subs.get(id);
  set?.delete(res);
  if (set?.size === 0) subs.delete(id);
}

export function publish(id: string, ev: string, data: unknown): void {
  const text = frame(ev, data);
  for (const res of subs.get(id) ?? []) res.write(text);
}
// ch09/hub.ts, continued
import { assistant } from "./graph.js";

/** Drives one run to the end. Deliberately never awaited by a
 *  request handler: nobody watching is not a reason to stop. */
export async function startRun(id: string, text: string) {
  const stream = await assistant.stream(
    { messages: [{ role: "user", content: text }] },
    {
      configurable: { thread_id: id },
      streamMode: ["updates", "custom"],
    },
  );
  try {
    for await (const [mode, payload] of stream) {
      publish(id, mode, payload);
    }
    publish(id, "end", { thread: id });
  } catch (err) {
    publish(id, "failed", { message: String(err) });
  }
}
