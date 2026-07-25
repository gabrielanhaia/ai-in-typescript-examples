// ch07/qdrant-store.ts
import { QdrantVectorStore } from "@langchain/qdrant";
import { EMBEDDING_DIMENSIONS, embedder } from "../ch06/embedder.js";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";

export async function openCollection(): Promise<QdrantVectorStore> {
  const store = new QdrantVectorStore(embedder, {
    url: QDRANT_URL,
    collectionName: "braxby",
    collectionConfig: {
      vectors: { size: EMBEDDING_DIMENSIONS, distance: "Cosine" },
    },
  });

  await store.ensureCollection();
  return store;
}
