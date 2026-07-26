// The line printed in chapter 4 under "Parallel tool calls are the default".
//
// Kept as a file so the type checker settles the placement question the
// chapter warns about: `disable_parallel_tool_use` is a member of
// `tool_choice`, not a sibling of `tools`.
import type { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/messages";
import { definitions } from "../ch03/toolbox.js";

export const ONE_AT_A_TIME: MessageCreateParamsNonStreaming = {
  model: "claude-sonnet-5",
  max_tokens: 8192,
  tools: definitions,
  tool_choice: { type: "auto", disable_parallel_tool_use: true },
  messages: [{ role: "user", content: "Where is order ORD-4471?" }],
};
