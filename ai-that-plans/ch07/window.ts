// ch07/window.ts
import { trimMessages } from "@langchain/core/messages";
import { countTokensApproximately } from "langchain";
import type { State } from "./state.js";

/** Shortens what the model SEES. The thread on disk is untouched
 *  and keeps growing. That is the correct behavior here. */
export async function windowFor(state: State) {
  return await trimMessages(state.messages, {
    maxTokens: 40_000,
    tokenCounter: countTokensApproximately,
    strategy: "last",
    startOn: "human",
    includeSystem: true,
  });
}
