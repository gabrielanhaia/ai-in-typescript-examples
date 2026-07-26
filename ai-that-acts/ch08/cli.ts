// PRINTED IN CHAPTER 8 as `ch08/cli.ts`.
//
// Three details are load-bearing: the default is no, the timeout declines,
// and the interface is closed in a `finally`.
import { createInterface } from "node:readline/promises";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import type { Reviewer } from "./gate.js";

export function cliReviewer(waitMs = 120_000): Reviewer {
  return {
    ask: async (call: ToolUseBlock, plan: string) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      try {
        const answer = await rl.question(
          `\n${plan}\n\nRun ${call.name}? [y/N] `,
          { signal: AbortSignal.timeout(waitMs) },
        );
        return answer.trim().toLowerCase() === "y";
      } catch {
        return false;
      } finally {
        rl.close();
      }
    },
  };
}
