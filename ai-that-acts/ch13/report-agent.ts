// PRINTED IN CHAPTER 13 as `ch13/report-agent.ts` — the shape to recognise,
// not the one to ship.
//
// The four-tool surface the chapter tables is not built here: two of its
// tools (`list_bookings`, `send_email`) do not exist in this repository, and
// `send_email` is the one that cannot be undone. What runs is the brief,
// the nightly ceilings and the loop, against the surface the application
// actually has — which is enough to watch the step count move week to week,
// and which is the chapter's point.
//
// This one costs money.
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { sessionFor } from "../ch06/session.js";
import { NIGHTLY } from "../ch09/limits.js";
import { runAgent } from "../ch09/agent.js";

const BRIEF = `Summarise last week's workshop bookings for the manager.
Say how many were completed and how many slipped, list anything still
waiting on parts, flag anything that needs chasing, and email it to
manager@braxbycycles.example.`;

const signal = AbortSignal.timeout(NIGHTLY.maxWallMs);
const session = sessionFor({
  customerId: "cust_4471",
  token: "token-for-4471",
  signal,
});

const nightly = { maxSteps: 12, maxTokens: 400_000, maxWallMs: 600_000 };
const messages: MessageParam[] = [{ role: "user", content: BRIEF }];

const { reply, spent } =
  await runAgent(messages, session, nightly, signal);

for (const block of reply?.content ?? []) {
  if (block.type === "text") console.log(block.text);
}
console.log(
  `\n[${spent.steps} steps, ${spent.tokens} tokens, ${spent.ms} ms]`,
);
