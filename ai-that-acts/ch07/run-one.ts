// PRINTED IN CHAPTER 7 as `ch07/run-one.ts` — `repair`, verbatim.
//
// NOT PRINTED: `runOne` itself, which chapters 7, 8, 9 and 14 all wrap and
// none of them prints. It parses, runs, classifies, and never throws.
//
// NOT PRINTED either: `CURRENT`. The chapter identifies the block's `id` as
// the value with the lifetime a write key wants — stable while one requested
// call is being served, including its retries, and never reused. An
// AsyncLocalStorage is exactly that scope, and it lets `refund.ts` read the
// key with no corresponding field on any schema.
import { AsyncLocalStorage } from "node:async_hooks";
import { z } from "zod";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import type { Outcome } from "../ch03/toolbox.js";
import type { Session } from "../ch06/session.js";
import { HttpFailure } from "./classify.js";

export function repair(error: z.ZodError): string {
  const problems = error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "(root)";
      return `${field}: ${issue.message}`;
    })
    .join("; ");

  return (
    `Those arguments never reached the tool — ${problems}. Send the ` +
    `call again with them corrected.`
  );
}

const CURRENT = new AsyncLocalStorage<ToolUseBlock>();

/** The call this tool is running for, or undefined outside the executor. */
export function currentCall(): ToolUseBlock | undefined {
  return CURRENT.getStore();
}

export async function runOne(
  call: ToolUseBlock,
  session: Session,
): Promise<Outcome> {
  const tool = session.byName.get(call.name);
  if (tool === undefined) {
    return { content: `No tool named "${call.name}".`, is_error: true };
  }

  try {
    const content = await CURRENT.run(call, () => tool.invoke(call.input));
    return { content, is_error: false };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { content: repair(error), is_error: true };
    }
    if (error instanceof HttpFailure) {
      return { content: error.forTheModel, is_error: true };
    }
    return {
      content: error instanceof Error ? error.message : String(error),
      is_error: true,
    };
  }
}
