// ch07/sources.ts
import { toSql } from "pgvector/pg";
import type { EmbeddedChunk } from "../ch06/embed-batch.js";
import { pool } from "./pool.js";

export async function replaceSource(
  sourceId: string,
  rows: EmbeddedChunk[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      "delete from chunks where source_id = $1",
      [sourceId],
    );
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
