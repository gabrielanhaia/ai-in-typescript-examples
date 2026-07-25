// ch08/keyword.ts
import { pool } from "../ch07/pool.js";
import { toHit, type Hit } from "./hit.js";

export async function keywordSearch(
  question: string,
  k: number,
): Promise<Hit[]> {
  const { rows } = await pool.query(
    `SELECT id::text, source_id, content, metadata,
            ts_rank_cd(fts, websearch_to_tsquery('english', $1)) AS score
       FROM chunks
      WHERE fts @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2`,
    [question, k],
  );

  return rows.map(toHit);
}
