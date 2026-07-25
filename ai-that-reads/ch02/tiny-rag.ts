// ch02/tiny-rag.ts
import { readdir, readFile } from "node:fs/promises";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "langchain";
import { OpenAIEmbeddings } from "@langchain/openai";

const question = process.argv[2] ?? "Is the frame warranty transferable?";
const dir = new URL("../corpus/plain/", import.meta.url);
const names = (await readdir(dir)).filter((n) => n.endsWith(".txt"));
const passages = await Promise.all(
  names.map((n) => readFile(new URL(n, dir), "utf8")),
);

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});
const shelf = await embeddings.embedDocuments(passages);
const asked = await embeddings.embedQuery(question);

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const ranked = passages
  .map((text, i) => ({
    text,
    name: names[i],
    score: cosine(asked, shelf[i]),
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 2);

const sources = ranked
  .map((r) => `<source name="${r.name}">\n${r.text}\n</source>`)
  .join("\n\n");

const model = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 400,
});
const answer = await model.invoke([
  new HumanMessage(
    `Answer using only the sources below. If they do not contain ` +
      `the answer, say you do not know.\n\n${sources}\n\n` +
      `Question: ${question}`,
  ),
]);

console.log(answer.text);
