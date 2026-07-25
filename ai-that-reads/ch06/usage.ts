// ch06/usage.ts
import OpenAI from "openai";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./embedder.js";

const client = new OpenAI();

export interface IndexCost {
  tokens: number;
  vectors: number;
}

export async function measureIndexCost(
  texts: string[],
): Promise<IndexCost> {
  let tokens = 0;
  let vectors = 0;

  for (let start = 0; start < texts.length; start += 96) {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      input: texts.slice(start, start + 96),
    });

    tokens += response.usage.total_tokens;
    vectors += response.data.length;
  }

  return { tokens, vectors };
}
