// ch13/plan.ts
import type { OnDisk } from "./scan.js";

export interface Indexed {
  sourceId: string;
  hash: string;
}

export interface Plan {
  unchanged: string[];
  changed: OnDisk[];
  deleted: string[];
}

export function planRefresh(onDisk: OnDisk[], indexed: Indexed[]): Plan {
  const previous = new Map(
    indexed.map((row) => [row.sourceId, row.hash]),
  );
  const present = new Set(onDisk.map((file) => file.sourceId));

  const unchanged: string[] = [];
  const changed: OnDisk[] = [];

  for (const file of onDisk) {
    if (previous.get(file.sourceId) === file.hash) {
      unchanged.push(file.sourceId);
    } else changed.push(file);
  }

  return {
    unchanged,
    changed,
    deleted: indexed
      .map((row) => row.sourceId)
      .filter((sourceId) => !present.has(sourceId)),
  };
}
