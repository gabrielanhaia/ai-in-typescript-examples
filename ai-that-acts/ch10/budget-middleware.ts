// PRINTED IN CHAPTER 10 as `ch10/budget-middleware.ts`.
//
// The row the mapping table left empty: there is no token-budget middleware,
// so this is chapter 9's ledger written as one.
import { createMiddleware } from "langchain";
import { isAIMessage } from "@langchain/core/messages";

/** Chapter 9's ledger, as the row the mapping table left empty. */
export function tokenBudget(maxTokens: number) {
  let spent = 0;

  return createMiddleware({
    name: "TokenBudget",
    afterModel: {
      hook: (state) => {
        const last = state.messages.at(-1);
        if (last === undefined || !isAIMessage(last)) return undefined;

        spent += last.usage_metadata?.total_tokens ?? 0;
        if (spent < maxTokens) return undefined;

        console.warn(`token budget reached: ${spent}/${maxTokens}`);
        return { jumpTo: "end" as const };
      },
      canJumpTo: ["end"],
    },
  });
}
