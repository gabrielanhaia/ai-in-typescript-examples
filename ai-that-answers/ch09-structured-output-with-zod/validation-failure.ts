// Two ways to survive a schema mismatch. The first catches the thrown
// OutputParserException; the second asks for the raw message alongside the
// parsed one, so a parse failure arrives as parsed === null instead.
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import { OutputParserException } from "@langchain/core/output_parsers";
import { Triage, type Triage as TriageValue } from "./schema.js";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

const messages = [
  new SystemMessage("You triage inbound support messages."),
  new HumanMessage("The export button on the reports page does nothing."),
];

function fallback(): TriageValue {
  return {
    category: "other",
    urgency: "normal",
    summary: "Could not be triaged automatically.",
    productArea: null,
  };
}

export async function throwing(): Promise<TriageValue | null> {
  const triager = model.withStructuredOutput(Triage, { name: "triage" });

  try {
    const result = await triager.invoke(messages);
    return result;
  } catch (error) {
    if (error instanceof OutputParserException) {
      console.error("schema mismatch:", error.message);
      console.error("raw text:", error.llmOutput);
      return null;
    }
    throw error;
  }
}

export async function withRaw(): Promise<TriageValue> {
  const triager = model.withStructuredOutput(Triage, {
    name: "triage",
    includeRaw: true,
  });

  const { raw, parsed } = await triager.invoke(messages);

  if (parsed === null) {
    console.warn("could not parse", raw.text);
    return fallback();
  }

  return parsed;
}

console.log(await throwing());
console.log(await withRaw());
