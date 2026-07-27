// NOT A LISTING FROM CHAPTER 14.
//
// `ch14/graph.ts` imports `recall` and `remember` from here, and the chapter
// says why it does not print them: "recall and remember are chapter 7's store
// reader and fact writer". They are that file, unchanged in behaviour, with
// two edits this assembly forces and nothing else:
//
//   1. They read and write `Job` / `JobUpdate` from ch14's state instead of
//      chapter 7's `State` / `Update`. Both declare `messages`, `customerId`
//      and `known`, which is every channel these two nodes touch.
//   2. Chapter 7's `ch07/namespaces.ts` is folded in at the top rather than
//      being a fourth file, because in this build exactly two functions read
//      it and both are here.
//
// `remember` calls a model, so importing this module needs ANTHROPIC_API_KEY.
import { ChatAnthropic } from "@langchain/anthropic";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getStore } from "@langchain/langgraph";
import { z } from "zod";
import type { Job, JobUpdate } from "./state.js";

const ROOT = "braxby";

/** Every namespace in the application is built here. Renaming a
 *  level is then one edit instead of a grep across every node. */
function customerNs(id: string): string[] {
  return [ROOT, "customer", id];
}

function preferencesNs(id: string): string[] {
  return [...customerNs(id), "preferences"];
}

function factsNs(id: string): string[] {
  return [...customerNs(id), "facts"];
}

/** Reads what we already know about this customer once, at the top
 *  of the run, so no later node has to touch the store at all. */
export async function recall(
  state: Job,
  config: LangGraphRunnableConfig,
): Promise<JobUpdate> {
  const store = getStore(config);
  if (!store) return {};

  const id = state.customerId;
  const prefs = await store.get(preferencesNs(id), "contact");
  const facts = await store.search(factsNs(id), { limit: 100 });

  return {
    known: [
      ...(prefs ? [`Contact by ${String(prefs.value.channel)}.`] : []),
      ...facts.map((f) => String(f.value.text)),
    ],
  };
}

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
  state: Job,
  config: LangGraphRunnableConfig,
): Promise<JobUpdate> {
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
