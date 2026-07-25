// ch06/embed-batch.ts
import type { Chunk } from "../ch04/chunk.js";
import { embedder } from "./embedder.js";

export interface EmbeddedChunk {
  chunk: Chunk;
  vector: number[];
}

export async function embedChunks(
  chunks: Chunk[],
): Promise<EmbeddedChunk[]> {
  const started = performance.now();
  const vectors = await embedder.embedDocuments(
    chunks.map((chunk) => chunk.pageContent),
  );
  const seconds = (performance.now() - started) / 1000;

  console.log(
    `${chunks.length} chunks in ${seconds.toFixed(1)}s ` +
      `(${(chunks.length / seconds).toFixed(0)} chunks/s)`,
  );

  return chunks.map((chunk, i) => ({ chunk, vector: vectors[i] }));
}
