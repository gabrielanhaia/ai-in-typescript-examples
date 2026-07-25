// ch02/embed.ts
import { OpenAIEmbeddings } from "@langchain/openai";

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

export async function embedPassages(
  texts: string[],
): Promise<number[][]> {
  return embeddings.embedDocuments(texts);
}

export async function embedQuestion(text: string): Promise<number[]> {
  return embeddings.embedQuery(text);
}
