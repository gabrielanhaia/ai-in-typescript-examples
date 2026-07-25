// ch12/triage.ts
import { retrieve } from "../ch09/retrieve.js";
import { supports } from "./match.js";
import { loadQuestions } from "./questions.js";

export async function explain(id: string, k: number): Promise<void> {
  const questions = await loadQuestions("corpus/questions.jsonl");
  const question = questions.find((candidate) => candidate.id === id);
  if (question === undefined) throw new Error(`no question ${id}`);

  console.log(`${question.id}  ${question.question}`);
  for (const passage of question.supporting) {
    console.log(`  wanted   ${passage.file}   "${passage.key}"`);
  }

  const hits = await retrieve(question.question, k);
  hits.forEach((hit, index) => {
    const correct = question.supporting.some((passage) =>
      supports(hit, passage),
    );
    const head = hit.content.slice(0, 60).replace(/\s+/g, " ");
    const rank = String(index + 1).padStart(2);
    const mark = correct ? "*" : " ";
    console.log(`  ${mark} ${rank}  ${hit.sourceId}  ${head}`);
  });
}
