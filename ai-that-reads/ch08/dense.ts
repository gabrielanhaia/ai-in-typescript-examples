// ch08/dense.ts
import { embedder } from "../ch06/embedder.js";
import { pool } from "../ch07/pool.js";
import { toHit, type Hit } from "./hit.js";

export async function denseSearch(
  question: string,
  k: number,
): Promise<Hit[]> {
  const vector = await embedder.embedQuery(question);

  const { rows } = await pool.query(
    `SELECT id::text, source_id, content, metadata,
            1 - (embedding <=> $1::vector) AS score
       FROM chunks
      ORDER BY embedding <=> $1::vector
      LIMIT $2`,
    [JSON.stringify(vector), k],
  );

  return rows.map(toHit);
}
