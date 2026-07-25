// ch09/retrieve.ts
import { hybridSearch } from "../ch08/hybrid.js";
import type { Fused } from "../ch08/rrf.js";
import { reranker } from "./rerank.js";

export interface Reranked extends Fused {
  relevance: number;
}

export async function retrieve(
  question: string,
  k = 5,
): Promise<Reranked[]> {
  const candidates = await hybridSearch(question, {
    candidates: 50,
    k: 50,
  });
  if (candidates.length === 0) return [];

  const ranked = await reranker.rerank(
    candidates.map((hit) => hit.content),
    question,
    { topN: k },
  );

  return ranked.flatMap(({ index, relevanceScore }) => {
    const hit = candidates[index];
    if (hit === undefined) return [];
    return [{ ...hit, relevance: relevanceScore }];
  });
}
