// ch08/hybrid.ts
import { denseSearch } from "./dense.js";
import { keywordSearch } from "./keyword.js";
import { fuse, type Fused } from "./rrf.js";

export interface HybridOptions {
  /** How many each retriever returns before fusion. */
  candidates?: number;
  /** How many survive into the prompt. */
  k?: number;
}

export async function hybridSearch(
  question: string,
  options: HybridOptions = {},
): Promise<Fused[]> {
  const { candidates = 50, k = 8 } = options;

  const [dense, keyword] = await Promise.all([
    denseSearch(question, candidates),
    keywordSearch(question, candidates),
  ]);

  return fuse([dense, keyword]).slice(0, k);
}
