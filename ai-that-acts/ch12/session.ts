// PRINTED IN CHAPTER 12 as `ch12/session.ts` — chapter 6's session, one tool
// longer. The two lines the chapter elides with a comment are chapter 6's,
// unchanged.
import type { ToolContext } from "../ch06/context.js";
import type { Session } from "../ch06/session.js";
import { toolboxFor } from "../ch06/toolbox.js";
import { searchDocs } from "./search-tool.js";

export function sessionFor(
  ctx: ToolContext,
  sources: Map<string, string>,
): Session {
  const tools = [...toolboxFor(ctx), searchDocs(sources)];

  return {
    definitions: tools.map((tool) => tool.definition),
    byName: new Map(tools.map((tool) => [tool.definition.name, tool])),
  };
}
