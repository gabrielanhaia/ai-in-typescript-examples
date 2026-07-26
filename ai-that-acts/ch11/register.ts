// PRINTED IN CHAPTER 11 as `ch11/register.ts` — `asDefinition`.
//
// NOT PRINTED: `registerAll`, which the chapter names when it tells you to
// take the `isError` check out of it and watch a failure become an answer.
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";
import type { RegisteredTool } from "../ch03/define-tool.js";

/** MCP speaks `inputSchema` at draft-07. The provider wants
 *  `input_schema` at 2020-12. Copy the four fields that mean the same
 *  thing and leave the rest of MCP's envelope behind. */
export function asDefinition(prefix: string, tool: McpTool): Tool {
  const { type, properties, required } = tool.inputSchema as {
    type?: string;
    properties?: unknown;
    required?: string[];
  };
  if (type !== "object") {
    throw new Error(`${tool.name}: input schema is not an object schema`);
  }

  return {
    name: `${prefix}_${tool.name}`,
    description: tool.description ?? tool.title ?? tool.name,
    input_schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: properties ?? {},
      required: required ?? [],
    } as Tool.InputSchema,
  };
}

interface McpText {
  readonly type: string;
  readonly text?: string;
}

/** Turns what a server advertises into entries chapter 3's registry accepts.
 *  The model sees the prefixed name; the protocol sees the original, because
 *  the prefix is stripped before the call goes out. */
export function registerAll(
  client: Client,
  prefix: string,
  tools: McpTool[],
): RegisteredTool[] {
  return tools.map((tool) => ({
    definition: asDefinition(prefix, tool),
    invoke: async (raw: unknown) => {
      const result = await client.callTool({
        name: tool.name,
        arguments: (raw ?? {}) as Record<string, unknown>,
      });

      const text = ((result.content ?? []) as McpText[])
        .filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("\n");

      // MCP writes `isError`; the provider writes `is_error`. A tool that
      // threw, a tool that does not exist and a schema rejection all arrive
      // here as a resolved promise with this flag set. Throwing puts them on
      // chapter 7's existing path.
      if (result.isError === true) {
        throw new Error(text === "" ? `${tool.name} failed` : text);
      }

      return text;
    },
  }));
}
