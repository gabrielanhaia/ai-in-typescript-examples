// PRINTED IN CHAPTER 9 as `ch09/batch.ts` — the cache-hit branch, which the
// chapter shows on its own. This is chapter 7's batch with that branch in
// front of `runOne`; chapter 8's gate is deliberately not in it, and
// chapter 14 is where the two additions meet in one file.
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import type { Outcome } from "../ch03/toolbox.js";
import type { Session } from "../ch06/session.js";
import { runOne } from "../ch07/run-one.js";
import type { Repeats } from "./repeats.js";

export async function resultsFor(
  calls: ToolUseBlock[],
  session: Session,
  repeats: Repeats,
): Promise<ToolResultBlockParam[]> {
  const settled = await Promise.allSettled(
    calls.map(async (call): Promise<Outcome> => {
      const before = repeats.seen(call);
      if (before !== undefined) {
        return {
          content:
            `You already called ${call.name} with exactly these ` +
            `arguments in this conversation. Nothing has changed since. ` +
            `The answer was: ${before}`,
          is_error: false,
        };
      }

      const outcome = await runOne(call, session);
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
