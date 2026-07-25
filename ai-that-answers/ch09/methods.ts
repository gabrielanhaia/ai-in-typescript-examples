// Two strategies, one option. Both bind the same schema; they differ in how the
// provider is asked to honour it.
import { ChatAnthropic } from "@langchain/anthropic";
import { Triage } from "./schema.js";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

export const viaFunctionCalling = model.withStructuredOutput(Triage, {
  method: "functionCalling",
});

export const viaJsonSchema = model.withStructuredOutput(Triage, {
  method: "jsonSchema",
});
