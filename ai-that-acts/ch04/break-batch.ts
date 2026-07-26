// PRINTED IN CHAPTER 4 under "When one tool in a batch fails" — the
// belt-and-braces version the book deliberately does not ship.
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { execute } from "../ch03/toolbox.js";

export async function beltAndBraces(
  calls: ToolUseBlock[],
): Promise<ToolResultBlockParam[]> {
  const results = await Promise.all(
    calls.map(async (call): Promise<ToolResultBlockParam> => {
      const outcome = await execute(call).catch((error) => ({
        content: `The tool crashed: ${error}`,
        is_error: true,
      }));
      return { type: "tool_result", tool_use_id: call.id, ...outcome };
    }),
  );
  return results;
}
