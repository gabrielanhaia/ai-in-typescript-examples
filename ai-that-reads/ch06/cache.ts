// ch06/cache.ts
import { createHash } from "node:crypto";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  embedder,
} from "./embedder.js";

/**
 * Identity of a vector: the text, plus the model and dimensions that
 * made it.
 */
export function vectorKey(text: string): string {
  return createHash("sha256")
    .update(`${EMBEDDING_MODEL}:${EMBEDDING_DIMENSIONS}:${text}`)
    .digest("hex");
}

export interface VectorCache {
  get(key: string): Promise<number[] | undefined>;
  set(key: string, vector: number[]): Promise<void>;
}

export async function embedWithCache(
  texts: string[],
  cache: VectorCache,
): Promise<number[][]> {
  const keys = texts.map(vectorKey);
  const found = await Promise.all(keys.map((key) => cache.get(key)));

  const missing = found.flatMap((vector, index) =>
    vector === undefined ? [index] : [],
  );
  const hits = texts.length - missing.length;
  console.log(`${hits} cached, ${missing.length} to embed`);

  if (missing.length > 0) {
    const fresh = await embedder.embedDocuments(
      missing.map((i) => texts[i]),
    );
    for (const [position, index] of missing.entries()) {
      found[index] = fresh[position];
      await cache.set(keys[index], fresh[position]);
    }
  }

  return found as number[][];
}
