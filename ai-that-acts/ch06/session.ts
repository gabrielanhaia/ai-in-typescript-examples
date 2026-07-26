// PRINTED IN CHAPTER 6 as `ch06/session.ts`.
//
// The `Session` interface is not printed — the chapter names "the two things
// chapter 4's loop needs" and derives them.
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { RegisteredTool } from "../ch03/define-tool.js";
import type { ToolContext } from "./context.js";
import { toolboxFor } from "./toolbox.js";

export interface Session {
  readonly definitions: Tool[];
  readonly byName: Map<string, RegisteredTool>;
}

export function sessionFor(ctx: ToolContext): Session {
  const tools = toolboxFor(ctx);

  return {
    definitions: tools.map((tool) => tool.definition),
    byName: new Map(tools.map((tool) => [tool.definition.name, tool])),
  };
}
