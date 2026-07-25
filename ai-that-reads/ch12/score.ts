// ch12/score.ts
import type { EvalQuestion } from "./questions.js";
import { supports, type Retrieved } from "./match.js";

/** 1-based rank of the first correct chunk; undefined if there is none */
export function rankOf(
  hits: Retrieved[],
  question: EvalQuestion,
): number | undefined {
  if (question.requires_all) {
    const each = question.supporting.map((passage) =>
      hits.findIndex((hit) => supports(hit, passage)),
    );
    if (each.some((position) => position === -1)) return undefined;
    return Math.max(...each) + 1;
  }

  const first = hits.findIndex((hit) =>
    question.supporting.some((passage) => supports(hit, passage)),
  );
  return first === -1 ? undefined : first + 1;
}

export type Ranks = (number | undefined)[];

export function recallAt(ranks: Ranks, k: number): number {
  const found = ranks.filter((rank) => rank !== undefined && rank <= k);
  return found.length / ranks.length;
}

export function mrrAt(ranks: Ranks, k: number): number {
  const total = ranks.reduce<number>(
    (sum, rank) => sum + (rank !== undefined && rank <= k ? 1 / rank : 0),
    0,
  );
  return total / ranks.length;
}
