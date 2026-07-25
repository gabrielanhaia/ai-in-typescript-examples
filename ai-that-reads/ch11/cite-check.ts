// ch11/cite-check.ts
import type { Citation } from "./render.js";
import type { KeyedQuestion } from "./answer-key.js";

export interface CiteResult {
  id: string;
  citedAuthoritative: boolean;
  citedSomethingSupporting: boolean;
}

export function scoreCitations(
  question: KeyedQuestion,
  cited: Citation[],
): CiteResult {
  const files = cited.map((c) => c.chunkId.split("#")[0]);
  const supporting = new Set(question.supporting.map((s) => s.file));
  const key = question.authoritative;

  return {
    id: question.id,
    citedAuthoritative: key !== null && files.includes(key),
    citedSomethingSupporting: files.some((file) => supporting.has(file)),
  };
}
