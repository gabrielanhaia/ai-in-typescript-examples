// ch09/framework.ts
import { ContextualCompressionRetriever }
  from "@langchain/classic/retrievers/contextual_compression";
import { CohereRerank } from "@langchain/cohere";
import type { BaseRetrieverInterface } from "@langchain/core/retrievers";

export function withRerank(
  base: BaseRetrieverInterface,
): ContextualCompressionRetriever {
  return new ContextualCompressionRetriever({
    baseCompressor: new CohereRerank({
      model: "rerank-v4.0-fast",
      topN: 5,
    }),
    baseRetriever: base,
  });
}
