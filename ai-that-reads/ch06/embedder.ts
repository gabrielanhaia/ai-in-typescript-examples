// ch06/embedder.ts
import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * The embedding model, its dimension count, and the batch size, in
 * one place.
 */
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export const embedder = new OpenAIEmbeddings({
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
  batchSize: 96,
  maxConcurrency: 4,
  maxRetries: 6,
});
