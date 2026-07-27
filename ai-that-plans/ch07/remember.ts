// ch07/remember.ts
import { ChatAnthropic } from "@langchain/anthropic";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getStore } from "@langchain/langgraph";
import { z } from "zod";
import { factsNs } from "./namespaces.js";
import type { State, Update } from "./state.js";

const Facts = z.object({
  facts: z
    .array(
      z.object({
        key: z.string().describe("stable slug, e.g. frame_number"),
        text: z.string().describe("one sentence, no pronouns"),
      }),
    )
    .describe(
      "Only things still true in six months. An empty array is " +
        "the correct answer for most conversations.",
    ),
});

const extractor = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 2048,
}).withStructuredOutput(Facts, { name: "facts" });

export async function remember(
  state: State,
  config: LangGraphRunnableConfig,
): Promise<Update> {
  const store = getStore(config);
  if (!store) return {};

  const { facts } = await extractor.invoke(state.messages);
  const ns = factsNs(state.customerId);
  const writtenAt = new Date().toISOString();

  for (const fact of facts) {
    // Provenance is not optional. When a recalled fact turns out
    // to be wrong, this is the only way back to the conversation
    // that produced it.
    await store.put(ns, fact.key, {
      text: fact.text,
      writtenAt,
      thread: config.executionInfo?.threadId,
    });
  }
  return {};
}
