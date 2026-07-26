// PRINTED IN CHAPTER 8 as `ch08/batch.ts` — chapter 7's batch with one
// expression changed. The rest of the file is chapter 7's, unchanged.
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import type { Outcome } from "../ch03/toolbox.js";
import type { Session } from "../ch06/session.js";
import { runOne } from "../ch07/run-one.js";
import { gated, type Reviewer } from "./gate.js";
import { planFor } from "./plans.js";

export async function resultsFor(
  calls: ToolUseBlock[],
  session: Session,
  reviewer: Reviewer,
): Promise<ToolResultBlockParam[]> {
  const settled = await Promise.allSettled(
    calls.map((call) =>
      gated(call, planFor, reviewer, () => runOne(call, session)),
    ),
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
