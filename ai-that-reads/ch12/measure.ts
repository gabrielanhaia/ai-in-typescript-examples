// ch12/measure.ts
import { hybridSearch } from "../ch08/hybrid.js";
import { retrieve } from "../ch09/retrieve.js";
import type { Retrieved } from "./match.js";
import { loadQuestions, scorable } from "./questions.js";
import { mrrAt, rankOf, recallAt, type Ranks } from "./score.js";

const K = 10;

/** The stage under measurement. Comment one out to score the other. */
const search = (question: string): Promise<Retrieved[]> =>
  retrieve(question, K);
// const search = (question: string): Promise<Retrieved[]> =>
//   hybridSearch(question, { k: K });

const questions = scorable(await loadQuestions("corpus/questions.jsonl"));
const ranks: Ranks = [];

for (const question of questions) {
  const rank = rankOf(await search(question.question), question);
  ranks.push(rank);
  console.log(`${question.id}\t${rank ?? "miss"}\t${question.question}`);
}

console.log(`\n${questions.length} questions scored at k=${K}`);
console.log("k\trecall\tMRR");
for (const k of [1, 3, 5, 10]) {
  const recall = recallAt(ranks, k).toFixed(3);
  console.log(`${k}\t${recall}\t${mrrAt(ranks, k).toFixed(3)}`);
}
