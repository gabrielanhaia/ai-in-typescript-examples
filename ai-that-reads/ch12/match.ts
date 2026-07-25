// ch12/match.ts
import type { Supporting } from "./questions.js";

/** Everything the scorer needs from a chunk, and nothing else. */
export interface Retrieved {
  /** Chapter 3's sourceId: the file path, relative to the corpus root. */
  sourceId: string;
  content: string;
}

function flatten(text: string): string {
  return text.replace(/\s+/g, " ").toLowerCase();
}

export function supports(hit: Retrieved, passage: Supporting): boolean {
  return (
    hit.sourceId === passage.file &&
    flatten(hit.content).includes(flatten(passage.key))
  );
}
