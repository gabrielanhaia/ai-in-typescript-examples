import { AIMessage, HumanMessage, type BaseMessage } from "langchain";
import type { AIMessageChunk } from "@langchain/core/messages";
import { INTERACTIVE, MODEL } from "./config.js";
import { chatModel } from "./model.js";
import { providerOnly } from "./provider-options.js";
import { withDeadlines } from "./deadlines.js";
import { finishOf, type Finish } from "./finish.js";
import { trimIfOverBudget } from "./history.js";
import { costOf, RATES_VERIFIED_ON } from "./cost.js";

export interface Turn {
  finish: Finish;
  history: BaseMessage[];
}

export async function answer(
  history: BaseMessage[],
  question: string,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<Turn> {
  const model = await chatModel();
  const asked = new HumanMessage(question);
  let final: AIMessageChunk | undefined;

  const stream = withDeadlines(
    (deadline) =>
      model.stream(
        [...history, asked],
        providerOnly({
          signal:
            signal === undefined
              ? deadline
              : AbortSignal.any([signal, deadline]),
          cache_control: { type: "ephemeral" },
        }),
      ),
    INTERACTIVE,
  );

  for await (const chunk of stream) {
    if (chunk.text.length > 0) onText(chunk.text);
    final = final === undefined ? chunk : final.concat(chunk);
  }

  if (final === undefined) {
    return { finish: { kind: "unknown", text: "", reason: "empty" }, history };
  }

  const grown = [...history, asked, new AIMessage({ content: final.text })];
  const used = final.usage_metadata?.input_tokens ?? 0;

  const spend = final.usage_metadata;
  console.error(
    `[${MODEL.model}] ${spend?.input_tokens ?? 0} in / ` +
      `${spend?.output_tokens ?? 0} out ` +
      `= $${costOf(final).toFixed(6)} at ${RATES_VERIFIED_ON} rates`,
  );

  return { finish: finishOf(final), history: trimIfOverBudget(grown, used) };
}
