// PRINTED IN CHAPTER 7 as `ch07/batch.ts`.
//
// Note which array the output is derived from: `calls`. That is what keeps
// the count and the ordering tied to what was asked for.
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import type { Outcome } from "../ch03/toolbox.js";
import type { Session } from "../ch06/session.js";
import { runOne } from "./run-one.js";

export async function resultsFor(
  calls: ToolUseBlock[],
  session: Session,
): Promise<ToolResultBlockParam[]> {
  const settled = await Promise.allSettled(
    calls.map((call) => runOne(call, session)),
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
