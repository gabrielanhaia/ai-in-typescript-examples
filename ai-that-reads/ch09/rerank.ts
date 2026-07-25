// ch09/rerank.ts
import { CohereRerank } from "@langchain/cohere";

export const RERANK_MODEL = "rerank-v4.0-fast";

export const reranker = new CohereRerank({
  model: RERANK_MODEL,
  topN: 5,
});
