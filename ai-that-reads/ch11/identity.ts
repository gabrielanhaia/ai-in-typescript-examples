// ch11/identity.ts
import type { ChunkMetadata } from "../ch04/chunk.js";

/** The part of a chunk's metadata a citation is built from. */
export type Citable = Pick<
  ChunkMetadata,
  "chunkId" | "title" | "pages" | "headings"
>;

export function locationOf(meta: Citable): string {
  if (meta.pages !== undefined) {
    const [first, last] = meta.pages;
    return first === last ? `p. ${first}` : `pp. ${first}-${last}`;
  }

  const trail = meta.headings ?? [];
  return trail.length > 0 ? trail.join(" › ") : "";
}
