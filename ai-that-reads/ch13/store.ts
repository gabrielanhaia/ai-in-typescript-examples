// ch13/store.ts
import { toSql } from "pgvector/pg";
import type { EmbeddedChunk } from "../ch06/embed-batch.js";
import { pool } from "../ch07/pool.js";
import type { Indexed } from "./plan.js";

export async function indexedSources(): Promise<Indexed[]> {
  const result = await pool.query<Indexed>(
    `select source_id as "sourceId", hash from sources`,
  );
  return result.rows;
}

export async function replaceSource(
  sourceId: string,
  hash: string,
  rows: EmbeddedChunk[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");

    await client.query(
      `insert into sources (source_id, hash, chunk_count, indexed_at)
            values ($1, $2, $3, now())
       on conflict (source_id)
       do update set hash        = excluded.hash,
                     chunk_count = excluded.chunk_count,
                     indexed_at  = excluded.indexed_at`,
      [sourceId, hash, rows.length],
    );

    await client.query(`delete from chunks where source_id = $1`, [
      sourceId,
    ]);

    for (const { chunk, vector } of rows) {
      await client.query(
        `insert into chunks (source_id, content, metadata, embedding)
              values ($1, $2, $3, $4)`,
        [sourceId, chunk.pageContent, chunk.metadata, toSql(vector)],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

/** Deletes the sources row; the foreign key takes the chunks with it. */
export async function forgetSource(sourceId: string): Promise<void> {
  await pool.query(`delete from sources where source_id = $1`, [
    sourceId,
  ]);
}
