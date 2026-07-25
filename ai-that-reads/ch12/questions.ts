// ch12/questions.ts
import { readFile } from "node:fs/promises";

/** One passage that supports an answer: a file, and a substring in it. */
export interface Supporting {
  file: string;
  key: string;
  passage: string;
}

export interface EvalQuestion {
  id: string;
  question: string;
  answer: string | null;
  answer_type: "grounded" | "not_in_corpus";
  authoritative: string | null;
  supporting: Supporting[];
  /** Every supporting passage must be retrieved, not just one of them. */
  requires_all: boolean;
  /** The answer exists only on a page with no text layer. */
  requires_ocr: boolean;
}

export async function loadQuestions(
  path: string,
): Promise<EvalQuestion[]> {
  const file = await readFile(path, "utf8");
  return file
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as EvalQuestion);
}

/** What recall@k measures over: grounded, and reachable without OCR. */
export function scorable(questions: EvalQuestion[]): EvalQuestion[] {
  return questions.filter(
    (q) => q.answer_type === "grounded" && !q.requires_ocr,
  );
}

export function unanswerable(questions: EvalQuestion[]): EvalQuestion[] {
  return questions.filter((q) => q.answer_type === "not_in_corpus");
}
