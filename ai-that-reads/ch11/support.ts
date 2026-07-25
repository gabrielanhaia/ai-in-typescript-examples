// ch11/support.ts
import { pool } from "../ch07/pool.js";

/**
 * What share of the claim's lexemes appear in the cited chunk.
 * 1.0 means every content word of the claim is in the passage.
 */
export async function claimCoverage(
  chunkId: string,
  claim: string,
): Promise<number | null> {
  const { rows } = await pool.query<{ coverage: string }>(
    `WITH claim AS (SELECT to_tsvector('english', $2) AS v)
     SELECT cardinality(ARRAY(
              SELECT unnest(tsvector_to_array(claim.v))
              INTERSECT
              SELECT unnest(tsvector_to_array(c.fts))
            ))::float8
            / nullif(cardinality(tsvector_to_array(claim.v)), 0)
            AS coverage
       FROM chunks c, claim
      WHERE c.metadata->>'chunkId' = $1`,
    [chunkId, claim],
  );

  const coverage = rows[0]?.coverage;
  return coverage === undefined ? null : Number(coverage);
}
