// ch07/sql-store.ts
import { toSql } from "pgvector/pg";
import type { EmbeddedChunk } from "../ch06/embed-batch.js";
import { pool } from "./pool.js";

export interface Neighbour {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  distance: number;
}

export async function insertChunks(rows: EmbeddedChunk[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const { chunk, vector } of rows) {
      await client.query(
        `insert into chunks (source_id, content, metadata, embedding)
         values ($1, $2, $3, $4)`,
        [
          chunk.metadata.sourceId,
          chunk.pageContent,
          chunk.metadata,
          toSql(vector),
        ],
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

export async function nearest(
  queryVector: number[],
  k: number,
): Promise<Neighbour[]> {
  const result = await pool.query<Neighbour>(
    `select id::text, content, metadata, embedding <=> $1 as distance
       from chunks
      order by embedding <=> $1
      limit $2`,
    [toSql(queryVector), k],
  );

  return result.rows;
}
