// The smallest complete classify() the chapter's two test listings need. The
// point of the pair is the assertion style, not this function: the label set is
// the contract, the specific label is the expectation.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

export const LABELS = ["drivetrain", "brakes", "wheels", "frame", "other"];

const SYSTEM = `You triage bicycle support questions for Braxby Cycles.

Categories: ${LABELS.join(", ")}.

Output: the category and nothing else. One word, lowercase, no
punctuation, no preamble.`;

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 16,
  temperature: 0,
});

export async function classify(symptom: string): Promise<string> {
  const reply = await model.invoke([
    new SystemMessage(SYSTEM),
    new HumanMessage(symptom),
  ]);
  return reply.text.trim().toLowerCase();
}
