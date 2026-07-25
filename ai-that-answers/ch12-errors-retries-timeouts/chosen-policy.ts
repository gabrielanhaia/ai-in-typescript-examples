// The single highest-value line in the chapter: maxRetries, chosen rather than
// inherited. The framework's default is six retries with no cap. Also here: the
// SDK's default timeout on a buffered call is ten minutes, which is right for a
// batch job and absurd for a chat request.
import { ChatAnthropic } from "@langchain/anthropic";
import { describe } from "./describe.js";

export const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
  maxRetries: 2,        // 3 attempts, roughly 1-6 seconds of waiting
  maxConcurrency: 4,    // never more than four requests in flight
  clientOptions: { timeout: 30_000 },
  onFailedAttempt: (error) => {
    console.warn(`retrying: ${describe(error)}`);
  },
});
