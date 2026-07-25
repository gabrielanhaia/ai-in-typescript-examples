import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const RUNS = 10;
const SYSTEM = "Answer in one short sentence. No preamble.";
const QUESTION = "Name one advantage of a steel bicycle frame.";

async function sample(temperature: number): Promise<string[]> {
  const model = new ChatAnthropic({
    model: "claude-haiku-4-5",
    maxTokens: 128,
    temperature,
  });

  const answers: string[] = [];
  for (let i = 0; i < RUNS; i += 1) {
    const reply = await model.invoke([
      new SystemMessage(SYSTEM),
      new HumanMessage(QUESTION),
    ]);
    answers.push(reply.text.trim());
  }
  return answers;
}

function report(label: string, answers: string[]): void {
  const distinct = new Set(answers);
  console.log(`${label}: ${distinct.size} distinct / ${answers.length}`);
  for (const answer of distinct) {
    console.log(`  - ${answer}`);
  }
}

report("temperature 0", await sample(0));
report("temperature 1", await sample(1));
