// PRINTED IN CHAPTER 14 as `ch14/batch.ts` — the one file in this chapter
// that is new.
//
// The cache is consulted before the gate. Only successes are remembered. The
// mapping is still over `calls`.
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import type { Outcome } from "../ch03/toolbox.js";
import type { Session } from "../ch06/session.js";
import { runOne } from "../ch07/run-one.js";
import { gated, type Reviewer } from "../ch08/gate.js";
import { planFor } from "../ch08/plans.js";
import type { Repeats } from "../ch09/repeats.js";

export async function resultsFor(
  calls: ToolUseBlock[],
  session: Session,
  reviewer: Reviewer,
  repeats: Repeats,
): Promise<ToolResultBlockParam[]> {
  const settled = await Promise.allSettled(
    calls.map(async (call): Promise<Outcome> => {
      const before = repeats.seen(call);
      if (before !== undefined) {
        return {
          content:
            `You already called ${call.name} with exactly these ` +
            `arguments in this conversation. Nothing has changed ` +
            `since. The answer was: ${before}`,
          is_error: false,
        };
      }

      const outcome = await gated(call, planFor, reviewer, () =>
        runOne(call, session),
      );
      if (!outcome.is_error) repeats.remember(call, outcome.content);
      return outcome;
    }),
  );

  return calls.map((call, index) => {
    const attempt = settled[index];
    const outcome: Outcome =
      attempt.status === "fulfilled"
        ? attempt.value
        : {
            content:
              `The ${call.name} tool failed and gave no usable reason. ` +
              `Do not call it again with the same arguments.`,
            is_error: true,
          };

    return { type: "tool_result", tool_use_id: call.id, ...outcome };
  });
}
