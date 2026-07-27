// ch14/hub.ts
//
// The first half of this file is NOT a chapter 14 listing: it is chapter 9's
// `ch09/hub.ts`, carried forward unchanged, and chapter 14 prints only what
// comes after it — a listing whose own header says "continued from chapter
// 9". A thread can have several subscribers, so two open tabs both receive
// the run; `unsubscribe` deletes the empty set rather than leaving it,
// because a Map keyed by thread that never removes keys is a leak with a very
// slow fuse.
//
// `./env.js` is imported before `./build.js` on purpose. See ch14/env.ts.
import type { ServerResponse } from "node:http";
import "./env.js";
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

// ch14/hub.ts, continued from chapter 9
import { assistant } from "./build.js";

type RunInput = Parameters<typeof assistant.invoke>[0];

/** Never awaited by a request handler: the run is not the
 *  request, and step four spends the customer's money. */
export async function drive(thread: string, input: RunInput) {
  const config = { configurable: { thread_id: thread } };
  const stream = await assistant.stream(input, {
    ...config,
    streamMode: ["updates", "custom"],
    durability: "sync",
    subgraphs: true,
    // Six steps and a specialist. Forty is generous and finite.
    recursionLimit: 40,
  });
  try {
    for await (const [ns, mode, data] of stream) {
      publish(thread, mode, { ns, data });
    }
    const at = await assistant.getState(config);
    const open = at.tasks.find((t) => t.interrupts.length > 0);
    if (open) publish(thread, "paused", open.interrupts[0].value);
    else publish(thread, "end", { thread });
  } catch (err) {
    publish(thread, "failed", { message: String(err) });
  }
}
