// PRINTED IN CHAPTER 9 as `ch09/framework-limits.ts`, and the second block
// beneath it.
//
// Two middlewares with two different jobs. `modelCallLimitMiddleware` counts
// model calls; `toolCallLimitMiddleware` counts tool calls, optionally for
// one named tool, which the hand-written loop does not have at all.
import {
  modelCallLimitMiddleware,
  toolCallLimitMiddleware,
} from "langchain";

export const steps = modelCallLimitMiddleware({
  runLimit: 8,
  threadLimit: 40,
  exitBehavior: "end",
});

export const refunds = toolCallLimitMiddleware({
  toolName: "issue_refund",
  runLimit: 1,
  threadLimit: 3,
  exitBehavior: "continue",
});
