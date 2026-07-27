// ch11/measure.ts
import type { CompiledStateGraph } from "@langchain/langgraph";
import { add, empty, type Cost } from "./usage.js";

type AnyGraph = CompiledStateGraph<any, any, string, any, any>;

const TASK =
  "My Verano hybrid is under warranty and the rear hub is " +
  "grinding. Can you sort it?";

export async function measure(graph: AnyGraph, thread: string) {
  const started = Date.now();
  const total = empty();
  const seen = new Set<string>();

  const stream = await graph.stream(
    { messages: [{ role: "user", content: TASK }] },
    {
      configurable: { thread_id: thread },
      streamMode: "updates",
      subgraphs: true,
      recursionLimit: 60,
    },
  );

  for await (const chunk of stream) {
    const [, update] = chunk as [string[], Record<string, any>];
    for (const value of Object.values(update ?? {})) {
      const msgs = value?.messages;
      if (Array.isArray(msgs)) add(total, seen, msgs);
    }
  }
  return { ...total, ms: Date.now() - started } as Cost & {
    ms: number;
  };
}
