// ch11/answer-key.ts
import { readFile } from "node:fs/promises";

export interface KeyedQuestion {
  id: string;
  question: string;
  answer: string | null;
  authoritative: string | null;
  supporting: { file: string; key: string }[];
}

export async function loadAnswerKey(
  path: string,
): Promise<KeyedQuestion[]> {
  const text = await readFile(path, "utf8");

  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as KeyedQuestion);
}
