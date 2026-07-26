// PRINTED IN CHAPTER 4 under "Answer with a stale tool_use_id" — a bug on
// purpose.
//
// The chapter prints the three lines with a `// ...inside the map:` marker
// between them. Here they are inside the map, in the order that runs, so the
// failure is the one the chapter describes: it compiles cleanly and is
// rejected by the API from the second step onward.
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { execute } from "../ch03/toolbox.js";

export async function staleIds(
  calls: ToolUseBlock[],
): Promise<ToolResultBlockParam[]> {
  let held = "";

  return Promise.all(
    calls.map(async (call): Promise<ToolResultBlockParam> => {
      const outcome = await execute(call);
      const block: ToolResultBlockParam = {
        type: "tool_result",
        tool_use_id: held || call.id,
        ...outcome,
      };
      held = call.id;
      return block;
    }),
  );
}
