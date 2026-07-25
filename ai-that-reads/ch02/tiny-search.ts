// ch02/tiny-search.ts
import { cosine } from "./cosine.js";

export interface Shelved {
  readonly text: string;
  readonly name: string;
  readonly vector: number[];
}

export interface Scored {
  readonly text: string;
  readonly name: string;
  readonly score: number;
}

export function tinySearch(
  index: Shelved[],
  asked: number[],
  k: number,
): Scored[] {
  return index
    .map((entry) => ({
      text: entry.text,
      name: entry.name,
      score: cosine(asked, entry.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
