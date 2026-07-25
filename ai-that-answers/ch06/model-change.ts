// The harness pointed at the next tier up. Two edits, not one: the model ID, and
// the sampling parameter that this tier rejects with a 400. Re-score both
// variants after the swap; the previous sheet was measured on another model.
import { ChatAnthropic } from "@langchain/anthropic";

export const model = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 256,
  // temperature: 0,   <- delete this: 400 on claude-sonnet-5 (chapter 5)
});
