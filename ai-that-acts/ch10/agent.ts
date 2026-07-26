// PRINTED IN CHAPTER 10 as `ch10/agent.ts`.
//
// Between the four options and the middleware list, this stands in for the
// hand-written loop, the retry helper, and the step ceiling built earlier.
//
// Note the option name: `systemPrompt`. Spell it `prompt` and nothing
// complains — the agent simply runs without instructions.
import {
  createAgent,
  modelCallLimitMiddleware,
  toolRetryMiddleware,
} from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { TOOLS } from "./tools.js";
import { SYSTEM } from "./system.js";

export function agentFor(signal: AbortSignal) {
  return createAgent({
    model: new ChatAnthropic({
      model: "claude-sonnet-5",
      maxTokens: 8192,
      maxRetries: 2,
    }),
    tools: TOOLS,
    systemPrompt: SYSTEM,
    middleware: [
      modelCallLimitMiddleware({ runLimit: 8, exitBehavior: "end" }),
      toolRetryMiddleware({
        tools: ["get_order_status"],
        maxRetries: 3,
        initialDelayMs: 250,
        backoffFactor: 2,
        jitter: true,
        onFailure: "continue",
      }),
    ],
    signal,
  });
}
