// ch12/measure.ts
import { isAIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

/** One way of doing the work: one agent, or a whole team. */
export type Run = (task: string) => Promise<BaseMessage[]>;

export interface Cost {
  messages: number;
  modelCalls: number;
  inputTokens: number;
  outputTokens: number;
  ms: number;
}

export async function measure(
  run: Run,
  tasks: readonly string[],
): Promise<Cost> {
  const total: Cost = {
    messages: 0,
    modelCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    ms: 0,
  };
  for (const task of tasks) {
    const started = Date.now();
    const messages = await run(task);
    total.ms += Date.now() - started;
    total.messages += messages.length;
    for (const m of messages) {
      if (!isAIMessage(m)) continue;
      total.modelCalls += 1;
      // Absent when a provider omits usage on a response.
      const u = m.usage_metadata;
      if (u === undefined) continue;
      total.inputTokens += u.input_tokens;
      total.outputTokens += u.output_tokens;
    }
  }
  return total;
}
