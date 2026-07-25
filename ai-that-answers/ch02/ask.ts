// ask-minimal.ts with the three additions the chapter makes to it: the question
// comes from the command line, the token accounting goes to standard error so the
// answer itself stays pipeable, and the one stage worth measuring is measured.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const question = process.argv.slice(2).join(" ");

if (question.length === 0) {
  console.error('Usage: npm run ask -- "your question"');
  process.exit(1);
}

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 400,
});

const messages = [
  new SystemMessage("Answer in two sentences. No lists, no preamble."),
  new HumanMessage(question),
];

const started = performance.now();
const answer = await model.invoke(messages);
const elapsed = performance.now() - started;

console.log(answer.text);

console.error(answer.usage_metadata);
console.error(answer.response_metadata["stop_reason"]);

const usage = answer.usage_metadata;

if (usage !== undefined) {
  const cost =
    (usage.input_tokens / 1_000_000) * 1 + (usage.output_tokens / 1_000_000) * 5;
  console.error(
    `\n[${usage.input_tokens} in / ${usage.output_tokens} out ` +
      `= $${cost.toFixed(6)} at 2026-07-24 rates]`,
  );
}

console.error(`[${Math.round(elapsed)} ms wall clock]`);
