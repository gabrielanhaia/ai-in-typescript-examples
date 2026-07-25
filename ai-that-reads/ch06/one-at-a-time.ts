// ch06/one-at-a-time.ts
import { embedder } from "./embedder.js";

export async function embedSlowly(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (const text of texts) {
    vectors.push(await embedder.embedQuery(text));
  }

  return vectors;
}
