// ch13/loop.ts
import type { StateSnapshot } from "@langchain/langgraph";
import { fingerprint, pick } from "./fingerprint.js";

export interface Repeat {
  readonly cycle: string[];
  readonly laps: number;
  readonly fromStep: number;
}

/** Oldest-first snapshots in, the longest run of checkpoints that
 *  made no progress out, with the node names it cycled between. */
export function findRepeat(
  snaps: StateSnapshot[],
  keys: readonly string[],
  atLeast = 3,
): Repeat | undefined {
  const marks = snaps.map((s) => fingerprint(pick(s.values, keys)));
  let best: Repeat | undefined;
  let start = 0;
  for (let i = 1; i <= marks.length; i += 1) {
    if (i < marks.length && marks[i] === marks[start]) continue;
    const laps = i - start;
    if (laps >= atLeast && (!best || laps > best.laps)) {
      const window = snaps.slice(start, i);
      best = {
        cycle: [...new Set(window.flatMap((s) => s.next))],
        laps,
        fromStep: window[0].metadata?.step ?? -1,
      };
    }
    start = i;
  }
  return best;
}
