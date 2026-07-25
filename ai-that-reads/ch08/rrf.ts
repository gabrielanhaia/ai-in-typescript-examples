// ch08/rrf.ts
import type { Hit } from "./hit.js";

export interface Fused extends Hit {
  /**
   * The reciprocal-rank score. Comparable within one fusion,
   * not across runs.
   */
  rrf: number;
}

/** Merge ranked lists by position. `k` damps the advantage of rank 1. */
export function fuse(lists: Hit[][], k = 60): Fused[] {
  const fused = new Map<string, Fused>();

  for (const list of lists) {
    for (const [index, hit] of list.entries()) {
      const contribution = 1 / (k + index + 1);
      const seen = fused.get(hit.id);

      if (seen === undefined) {
        fused.set(hit.id, { ...hit, rrf: contribution });
      } else {
        seen.rrf += contribution;
      }
    }
  }

  return [...fused.values()].sort((a, b) => b.rrf - a.rrf);
}
