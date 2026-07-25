// ch14/migrate.ts
import { createHash } from "node:crypto";
import { Document } from "@langchain/core/documents";
import { QdrantVectorStore } from "@langchain/qdrant";
import { embedder } from "../ch06/embedder.js";
import { pool } from "../ch07/pool.js";
import { EMBEDDING_DIMENSIONS } from "./config.js";

interface StoredChunk {
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

/** Qdrant takes an unsigned integer or a UUID. `chunkId` is neither. */
function pointId(chunkId: string): string {
  const h = createHash("sha256").update(chunkId).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20, 32),
  ].join("-");
}

const store = new QdrantVectorStore(embedder, {
  url: process.env.QDRANT_URL ?? "http://localhost:6333",
  collectionName: "braxby",
  collectionConfig: {
    vectors: { size: EMBEDDING_DIMENSIONS, distance: "Cosine" },
  },
});
await store.ensureCollection();

for (let offset = 0; ; offset += 64) {
  const { rows } = await pool.query<StoredChunk>(
    `select content, metadata, embedding from chunks
      order by id limit 64 offset $1`,
    [offset],
  );
  if (rows.length === 0) break;

  await store.addVectors(
    rows.map((row) => row.embedding),
    rows.map((row) => {
      const { content, metadata } = row;
      return new Document({ pageContent: content, metadata });
    }),
    { ids: rows.map((row) => pointId(String(row.metadata.chunkId))) },
  );
}
