// ch14/config.test.ts
import { expect, test } from "vitest";
import { pool } from "../ch07/pool.js";
import {
  CHUNKS_TABLE,
  CHUNK_OVERLAP,
  CHUNK_SIZE,
  EMBEDDING_DIMENSIONS,
  SAMPLING,
} from "./config.js";

test("no sampling parameter is sent to a model that rejects one", () => {
  expect(Object.keys(SAMPLING)).toEqual([]);
});

test("the overlap is smaller than the chunk it overlaps", () => {
  expect(CHUNK_OVERLAP).toBeLessThan(CHUNK_SIZE);
});

test("the vector column is as wide as the embedding model", async () => {
  const result = await pool.query<{ dimension: number }>(
    `select atttypmod as dimension
       from pg_attribute
      where attrelid = $1::regclass and attname = 'embedding'`,
    [CHUNKS_TABLE],
  );
  expect(result.rows[0]?.dimension).toBe(EMBEDDING_DIMENSIONS);
});
