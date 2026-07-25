// ch06/build-index.ts
import type { Chunk } from "../ch04/chunk.js";
import { embedder } from "./embedder.js";
import { vectorKey, type VectorCache } from "./cache.js";

const BATCH = 96;

export async function buildIndex(
  chunks: Chunk[],
  cache: VectorCache,
): Promise<void> {
  for (let start = 0; start < chunks.length; start += BATCH) {
    const slice = chunks.slice(start, start + BATCH);
    const keys = slice.map((chunk) => vectorKey(chunk.pageContent));
    const found = await Promise.all(keys.map((key) => cache.get(key)));

    const todo = found.flatMap((v, i) => (v === undefined ? [i] : []));

    if (todo.length > 0) {
      const fresh = await embedder.embedDocuments(
        todo.map((i) => slice[i].pageContent),
      );
      for (const [position, i] of todo.entries()) {
        await cache.set(keys[i], fresh[position]);
      }
    }

    const done = start + slice.length;
    console.log(`${done}/${chunks.length} (${todo.length} new)`);
  }
}
