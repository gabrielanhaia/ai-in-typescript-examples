// ch09/sse.ts
import type { ServerResponse } from "node:http";

/** One frame. The blank line is what commits it; the payload is
 *  single-line JSON because a newline inside would split it. */
export function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function openStream(res: ServerResponse): void {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-store",
    connection: "keep-alive",
    // A proxy that buffers holds the entire run and delivers it
    // in one lump at the end, which looks exactly like a hang.
    "x-accel-buffering": "no",
  });
  // How long the browser waits before reconnecting on its own.
  res.write("retry: 2000\n\n");
}
