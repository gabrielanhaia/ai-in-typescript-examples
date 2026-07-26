// NOT A LISTING FROM THE BOOK — but the module the book names.
//
// Book 2's retrieval pipeline, shipped as a fixture. Chapter 12 imports
// `retrieve` from here and wraps it in a schema and a description; nothing in
// that chapter touches this file.
//
// This is the REDUCED version, on purpose. Book 2's own pipeline is a dense
// search and a keyword search fused by rank, a cross-encoder over fifty
// candidates, and a Postgres database behind both. Reproducing that here would
// put a container, an embeddings vendor and a reranking vendor between a
// reader of this book and their first tool call, so what ships instead is the
// same interface over a small pre-built index: `retrieve(query, k)` in,
// ranked passages with their metadata out.
//
// If you finished Book 2, point chapter 12's import at your own retriever and
// delete this directory. The signature is the one you already have.
import { readFileSync } from "node:fs";

export interface Reranked {
  readonly content: string;
  readonly metadata: Record<string, unknown>;
  readonly score: number;
}

export interface Citable {
  readonly title: string;
  readonly section?: string;
  readonly page?: number;
  readonly chunkId: string;
}

interface Chunk {
  readonly chunkId: string;
  readonly sourceId: string;
  readonly title: string;
  readonly section: string;
  readonly content: string;
}

const INDEX: Chunk[] = JSON.parse(
  readFileSync(new URL("index.json", import.meta.url), "utf8"),
) as Chunk[];

/** Narrows whatever the store kept alongside a chunk down to the handful of
 *  fields a citation is built from. */
export function citable(hit: Reranked): Citable {
  return hit.metadata as unknown as Citable;
}

/** Book 2's human location for a citable. */
export function locationOf(meta: Citable): string {
  if (meta.section !== undefined && meta.section !== "") return meta.section;
  return meta.page === undefined ? "" : `p. ${meta.page}`;
}

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
  "for", "from", "has", "have", "how", "i", "if", "in", "is", "it", "its",
  "long", "me", "my", "no", "not", "of", "on", "or", "our", "that", "the",
  "their", "them", "then", "there", "these", "they", "this", "to", "was",
  "we", "what", "when", "where", "which", "who", "will", "with", "you",
  "your",
]);

function terms(text: string): string[] {
  const found = text.toLowerCase().match(/[a-z0-9][a-z0-9-]*/g) ?? [];
  const out: string[] = [];

  for (const term of found) {
    out.push(term);
    // A hyphenated word is indexed whole and in halves, so a query saying
    // "workshop built" reaches a policy saying "workshop-built". Book 2 gets
    // this from the dense half of its hybrid search; the reduced fixture has
    // to do it in the tokeniser.
    if (term.includes("-")) out.push(...term.split("-"));
  }

  return out.filter((term) => term.length > 1 && !STOP.has(term));
}

function stem(term: string): string {
  return term.replace(/(ies|es|s)$/, (suffix) =>
    suffix === "ies" ? "y" : "",
  );
}

// Document frequency over the shipped index, computed once at import.
const DF = new Map<string, number>();
const LENGTHS: number[] = [];
const TERMS: string[][] = INDEX.map((chunk) => {
  const bag = terms(`${chunk.title} ${chunk.section} ${chunk.content}`).map(
    stem,
  );
  LENGTHS.push(bag.length);
  for (const term of new Set(bag)) DF.set(term, (DF.get(term) ?? 0) + 1);
  return bag;
});
const AVERAGE = LENGTHS.reduce((sum, n) => sum + n, 0) / (LENGTHS.length || 1);

// Okapi BM25. Book 2 fuses this with a dense search and reranks the result;
// on an index this small the lexical half alone finds the passages the book's
// examples turn on, including the bare part numbers dense search walks past.
const K1 = 1.4;
const B = 0.72;

function score(query: string[], document: number): number {
  const bag = TERMS[document] ?? [];
  const length = bag.length || 1;
  let total = 0;

  for (const term of new Set(query)) {
    const frequency = bag.filter((word) => word === term).length;
    if (frequency === 0) continue;
    const df = DF.get(term) ?? 0;
    const idf = Math.log(1 + (INDEX.length - df + 0.5) / (df + 0.5));
    total +=
      (idf * (frequency * (K1 + 1))) /
      (frequency + K1 * (1 - B + (B * length) / AVERAGE));
  }

  return total;
}

/**
 * A question in, the best `k` passages out, each carrying the metadata a
 * citation is built from. Nothing here reaches the network.
 */
export async function retrieve(
  query: string,
  k: number,
): Promise<Reranked[]> {
  const wanted = terms(query).map(stem);
  if (wanted.length === 0) return [];

  return INDEX.map((chunk, index) => ({
    content: chunk.content,
    metadata: {
      title: chunk.title,
      section: chunk.section,
      chunkId: chunk.chunkId,
      sourceId: chunk.sourceId,
    },
    score: score(wanted, index),
  }))
    .filter((hit) => hit.score > 0)
    .sort((one, two) => two.score - one.score)
    .slice(0, k);
}
