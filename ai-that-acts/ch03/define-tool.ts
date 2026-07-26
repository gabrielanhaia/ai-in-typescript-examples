// PRINTED IN CHAPTER 3 as `ch03/define-tool.ts`.
import { z } from "zod";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export interface RegisteredTool {
  readonly definition: Tool;
  readonly invoke: (raw: unknown) => Promise<string>;
}

export function defineTool<S extends z.ZodObject>(
  name: string,
  description: string,
  schema: S,
  run: (input: z.infer<S>) => Promise<string>,
): RegisteredTool {
  return {
    definition: {
      name,
      description,
      input_schema: z.toJSONSchema(schema) as Tool.InputSchema,
    },
    invoke: async (raw) => run(schema.parse(raw)),
  };
}
