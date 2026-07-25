// ch04/sweep.ts
import { embedPassages, embedQuestion } from "../ch02/embed.js";
import { tinySearch, type Shelved } from "../ch02/tiny-search.js";
import { loadCorpus } from "../ch03/load-corpus.js";
import { chunkDocument } from "./recursive.js";
import type { SourceDocument } from "../ch03/document.js";

interface Probe {
  /** A question a real user would type. */
  question: string;
  /** A phrase that appears in the one passage that answers it. */
  expect: string;
}

const PROBES: Probe[] = [
  { question: "Does the frame warranty transfer to a second owner?",
    expect: "not transferable" },
  { question: "How long do I have to return an unused part?",
    expect: "30 days" },
];

async function recallAtK(
  docs: SourceDocument[],
  probes: Probe[],
  size: number,
  overlap: number,
  k: number,
): Promise<number> {
  const chunks = (
    await Promise.all(docs.map((d) => chunkDocument(d, size, overlap)))
  ).flat();

  const vectors = await embedPassages(chunks.map((c) => c.pageContent));
  const index: Shelved[] = chunks.map((chunk, i) => ({
    text: chunk.pageContent,
    name: chunk.metadata.chunkId,
    vector: vectors[i],
  }));

  let found = 0;
  for (const probe of probes) {
    const asked = await embedQuestion(probe.question);
    const hits = tinySearch(index, asked, k);
    if (hits.some((hit) => hit.text.includes(probe.expect))) found += 1;
  }
  return found / probes.length;
}

const docs = await loadCorpus("corpus");
console.log("size\toverlap\tchunks\trecall@5");

for (const size of [300, 600, 1200, 2400]) {
  const overlap = Math.round(size * 0.15);
  const recall = await recallAtK(docs, PROBES, size, overlap, 5);
  console.log(`${size}\t${overlap}\t\t${recall.toFixed(2)}`);
}
