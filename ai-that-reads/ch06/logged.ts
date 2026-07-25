// ch06/logged.ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./embedder.js";

export const logged = new OpenAIEmbeddings({
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
  batchSize: 96,
  maxConcurrency: 4,
  onFailedAttempt: (error: unknown) => {
    const name = error instanceof Error ? error.name : "unknown";
    console.warn(`embedding attempt failed (${name}), retrying`);
  },
});
