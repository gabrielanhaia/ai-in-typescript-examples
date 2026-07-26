// The block printed in chapter 11 under "Calling it". The chapter prints it
// without a filename; it is the two lines `registerAll` is built around.
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";

export async function callOne(
  client: Client,
  tool: McpTool,
  raw: unknown,
) {
  const result = await client.callTool({
    name: tool.name,
    arguments: (raw ?? {}) as Record<string, unknown>,
  });

  return result;
}
