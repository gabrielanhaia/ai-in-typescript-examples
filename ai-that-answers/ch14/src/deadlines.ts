import type { AIMessageChunk } from "@langchain/core/messages";

export interface Deadlines {
  firstTokenMs: number;
  idleMs: number;
}

export class StreamStalled extends Error {
  constructor(readonly phase: "first-token" | "idle") {
    super(`stream stalled waiting for ${phase}`);
    this.name = "StreamStalled";
  }
}

export async function* withDeadlines(
  open: (signal: AbortSignal) => Promise<AsyncIterable<AIMessageChunk>>,
  d: Deadlines,
): AsyncGenerator<AIMessageChunk> {
  const controller = new AbortController();
  let phase: "first-token" | "idle" = "first-token";
  let timer = setTimeout(() => controller.abort(), d.firstTokenMs);

  try {
    for await (const chunk of await open(controller.signal)) {
      if (chunk.text.length > 0) {
        clearTimeout(timer);
        phase = "idle";
        timer = setTimeout(() => controller.abort(), d.idleMs);
      }
      yield chunk;
    }
  } catch (error) {
    if (controller.signal.aborted) throw new StreamStalled(phase);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
