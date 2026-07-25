// ch07/pgvector-store.ts
import { PGVectorStore } from "@langchain/pgvector";
import { EMBEDDING_DIMENSIONS, embedder } from "../ch06/embedder.js";

export async function openStore(): Promise<PGVectorStore> {
  return PGVectorStore.initialize(embedder, {
    postgresConnectionOptions: {
      connectionString: process.env.DATABASE_URL,
    },
    tableName: "chunks",
    dimensions: EMBEDDING_DIMENSIONS,
    distanceStrategy: "cosine",
    columns: {
      idColumnName: "id",
      contentColumnName: "content",
      metadataColumnName: "metadata",
      vectorColumnName: "embedding",
    },
  });
}
