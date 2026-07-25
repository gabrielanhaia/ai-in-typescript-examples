// ch08/hit.ts
export interface Hit {
  id: string;
  sourceId: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

/**
 * One row as the table spells it, before the column names
 * become field names.
 */
interface HitRow {
  id: string;
  source_id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export function toHit(row: HitRow): Hit {
  return {
    id: row.id,
    sourceId: row.source_id,
    content: row.content,
    metadata: row.metadata,
    score: Number(row.score),
  };
}
