// ch11/quote.ts
import { pool } from "../ch07/pool.js";

const OPTIONS = [
  "StartSel=[[",
  "StopSel=]]",
  "MaxFragments=1",
  "MaxWords=30",
  "MinWords=12",
].join(", ");

/**
 * The span of a chunk that carries a claim, or null when
 * nothing matched.
 */
export async function supportingSpan(
  chunkId: string,
  claim: string,
): Promise<string | null> {
  const { rows } = await pool.query<{ span: string }>(
    `SELECT ts_headline('english', content,
              websearch_to_tsquery('english', $2), $3) AS span
       FROM chunks
      WHERE metadata->>'chunkId' = $1`,
    [chunkId, claim, OPTIONS],
  );

  const span = rows[0]?.span;
  if (span === undefined || !span.includes("[[")) return null;

  return span;
}
