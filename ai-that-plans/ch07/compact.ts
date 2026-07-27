// ch07/compact.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { RemoveMessage } from "@langchain/core/messages";
import { REMOVE_ALL_MESSAGES } from "@langchain/langgraph";
import { countTokensApproximately } from "langchain";
import type { State, Update } from "./state.js";

const summarizer = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 4096,
});

const KEEP = 6;

export async function compact(state: State): Promise<Update> {
  if (countTokensApproximately(state.messages) < 40_000) return {};

  const older = state.messages.slice(0, -KEEP);
  const recent = state.messages.slice(-KEEP);

  const reply = await summarizer.invoke([
    ...older,
    {
      role: "user",
      content:
        "Summarize the conversation above as notes for whoever " +
        "picks this job up next. Keep every order number, part " +
        "number, date and decision verbatim. Drop pleasantries.",
    },
  ]);

  return {
    summary: reply.text,
    // The tombstone is the whole point. Without it the old turns
    // stay in the checkpoint and the thread never gets smaller.
    messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES }), ...recent],
  };
}
