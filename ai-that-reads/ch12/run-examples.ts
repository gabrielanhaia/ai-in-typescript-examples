// NOT A LISTING FROM THE BOOK.
//
// Chapter 12's harness, ch12/measure.ts, calls the full retrieval path, so it
// needs Postgres, an embedding key and a rerank key. The *scorer* needs none of
// that — it takes ranked hits and an answer key and returns two numbers. This
// runs it on a clean clone:
//
//   npm run run-example -- ch12
//
// Three parts:
//
//   1. What the shipped question set is made of, so the denominators in the
//      chapter are numbers you can check rather than take on trust.
//   2. The chapter's worked arithmetic, run.
//   3. A real recall@k and MRR table over the real corpus, produced by a
//      deliberately unsophisticated keyless retriever defined at the bottom of
//      this file. It is a floor, not a result — the whole point of chapters 5
//      to 9 is that it can be beaten — and it is here because a scorer that
//      has never been run against real ground truth is a scorer you are
//      trusting.
//
// It also reports whether every `key` in the answer key is reachable in the
// corpus at all, which is a corpus check rather than a retrieval one.
import { loadFile } from "../ch03/load-corpus.js";
import { chunkPages } from "../ch04/pages.js";
import { scanCorpus } from "../ch13/scan.js";
import { supports, type Retrieved } from "./match.js";
import type { Chunk } from "../ch04/chunk.js";
import { loadQuestions, scorable, unanswerable } from "./questions.js";
import { mrrAt, rankOf, recallAt, type Ranks } from "./score.js";

const K = 10;
const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 135;

const questions = await loadQuestions("corpus/questions.jsonl");
const scored = scorable(questions);
const absent = unanswerable(questions);
const ocr = questions.filter((q) => q.requires_ocr);
const both = questions.filter((q) => q.requires_all);
const multi = scored.filter((q) => q.supporting.length > 1);

console.log("the question set\n");
console.log(`  ${String(questions.length).padStart(3)}  lines in the file`);
console.log(
  `  ${String(questions.length - absent.length).padStart(3)}  grounded`,
);
console.log(`  ${String(absent.length).padStart(3)}  answer is not in the corpus`);
console.log(`  ${String(ocr.length).padStart(3)}  answerable only from a scanned page`);
console.log(`  ${String(scored.length).padStart(3)}  scorable: grounded and reachable without OCR`);
console.log(`  ${String(both.length).padStart(3)}  needs every supporting passage, not just one`);
console.log(
  `  ${String(multi.length).padStart(3)}  stated more than once in the corpus`,
);
console.log(
  `\n  Score all ${questions.length - absent.length} grounded questions instead of the ` +
    `${scored.length} scorable ones and recall\n  can never exceed ` +
    `${((questions.length - absent.length - ocr.length) / (questions.length - absent.length)).toFixed(3)}` +
    `, a ceiling built into the number by two questions\n  nobody can answer. Say which you did.`,
);

console.log("\n\nthe worked example from the chapter\n");
const worked: Ranks = [1, 4, undefined];
console.log(`  ranks    ${worked.map((r) => r ?? "miss").join(", ")}`);
console.log(`  recall@5 ${recallAt(worked, 5).toFixed(3)}   (2 / 3)`);
console.log(`  MRR      ${mrrAt(worked, 5).toFixed(3)}   ((1/1 + 1/4 + 0) / 3)`);
console.log(
  "\n  Every question stays in the denominator whether it was found or not.\n" +
    "  Drop the failures and the metric climbs as retrieval degrades, because\n" +
    "  the questions it now gets wrong have stopped being counted.",
);

// ---------------------------------------------------------------------------
// A keyless baseline retriever. Bag of words, no embeddings, no database.
// ---------------------------------------------------------------------------

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
  "for", "from", "has", "have", "how", "i", "if", "in", "is", "it", "long",
  "me", "my", "not", "of", "on", "or", "should", "that", "the", "there", "to",
  "was", "what", "when", "where", "which", "who", "will", "with", "you",
  "your",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((word) => word.length > 1 && !STOP.has(word));
}

// The same ingestion path ch13/sync.ts takes: scan the named folders, load one
// file at a time, and chunk a PDF's pages as one document. Chunking each page
// on its own mints the same `chunkId` once per page, which chapter 7's unique
// index rejects on the first multi-page PDF — so the shape of this loop is not
// a preference.
console.log("\n\nloading and chunking the corpus\n");
const onDisk = await scanCorpus("corpus", ["markdown", "html", "pdf"]);

const chunks: Chunk[] = [];
let units = 0;
for (const file of onDisk) {
  const pages = await loadFile(file.path);
  // The restamp ch13/sync.ts does, for the reason it does it: the loader
  // stamps the path it was handed, and the scan is what knows the root.
  // Without this the sourceId here is `corpus/markdown/x.md` and every
  // comparison against questions.jsonl's `markdown/x.md` is false.
  for (const page of pages) page.metadata.sourceId = file.sourceId;
  units += pages.length;
  chunks.push(...(await chunkPages(pages, CHUNK_SIZE, CHUNK_OVERLAP)));
}

const index = chunks.map((chunk) => ({
  sourceId: chunk.metadata.sourceId,
  content: chunk.pageContent,
  terms: new Set(words(chunk.pageContent)),
}));

console.log(
  `  ${onDisk.length} documents, ${units} loaded units, ` +
    `${chunks.length} chunks at ${CHUNK_SIZE}/${CHUNK_OVERLAP}`,
);

function search(question: string): Retrieved[] {
  const asked = [...new Set(words(question))];
  if (asked.length === 0) return [];

  return index
    .map((entry) => ({
      sourceId: entry.sourceId,
      content: entry.content,
      score:
        asked.filter((word) => entry.terms.has(word)).length / asked.length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, K);
}

// Is the ground truth even reachable? This is a corpus check: if a key never
// appears in any chunk, no retriever can ever score that question.
console.log("\n\nis every supporting passage reachable at all?\n");
let unreachable = 0;
for (const question of scored) {
  const missing = question.supporting.filter(
    (passage) =>
      !index.some((entry) =>
        supports({ sourceId: entry.sourceId, content: entry.content }, passage),
      ),
  );
  if (missing.length === 0) continue;
  unreachable += 1;
  for (const passage of missing) {
    console.log(`  ${question.id}  ${passage.file}   "${passage.key}"`);
  }
}
console.log(
  unreachable === 0
    ? `  every key in all ${scored.length} scorable questions is present in a chunk`
    : `  ${unreachable} questions have a key no chunk contains`,
);

console.log("\n\nbaseline: term overlap, no embeddings, no store\n");
const ranks: Ranks = [];
for (const question of scored) {
  const rank = rankOf(search(question.question), question);
  ranks.push(rank);
  console.log(
    `  ${question.id}\t${rank ?? "miss"}\t${question.question.slice(0, 62)}`,
  );
}

console.log(`\n${scored.length} questions scored at k=${K}`);
console.log("k\trecall\tMRR");
for (const k of [1, 3, 5, 10]) {
  console.log(
    `${k}\t${recallAt(ranks, k).toFixed(3)}\t${mrrAt(ranks, k).toFixed(3)}`,
  );
}

console.log(
  `\nOne question is ${(100 / scored.length).toFixed(1)} points of recall. Refuse to act on a\n` +
    "difference smaller than that.\n\n" +
    "Read that table for shape, not for a winner, and read it knowing what\n" +
    "produced it: a bag of words that has never heard of a synonym. That is\n" +
    "the floor chapters 5 to 9 are built to beat. Run ch12/measure.ts with a\n" +
    "key and a store to find out by how much on your machine.",
);
