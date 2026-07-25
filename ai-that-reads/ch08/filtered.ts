// ch08/filtered.ts
import { pool } from "../ch07/pool.js";
import { toHit, type Hit } from "./hit.js";

export async function keywordSearchWhere(
  question: string,
  k: number,
  type: string,
): Promise<Hit[]> {
  const { rows } = await pool.query(
    `SELECT id::text, source_id, content, metadata,
            ts_rank_cd(fts, websearch_to_tsquery('english', $1)) AS score
       FROM chunks
      WHERE fts @@ websearch_to_tsquery('english', $1)
        AND metadata->>'type' = $3
      ORDER BY score DESC
      LIMIT $2`,
    [question, k, type],
  );

  return rows.map(toHit);
}
