// PRINTED IN CHAPTER 13 as `ch13/report-agent.ts` — the shape to recognise,
// not the one to ship.
//
// Three tools, a paragraph of English, and chapter 9's unattended ceilings.
// The surface is `report-tools.ts`, so every tool the loop can reach is a
// read; the email is sent by the caller, after the run, in a line of code
// that cannot talk itself into a second attempt. `NIGHTLY` is imported and
// not restated, because chapter 9 derived it and a second copy of three
// numbers is two places to change them.
//
// This one costs money.
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { NIGHTLY } from "../ch09/limits.js";
import { runAgent } from "../ch09/agent.js";
import { reportSession } from "./report-tools.js";

const BRIEF = `Summarise last week's workshop bookings for the manager.
Last week ran from 2026-07-13 to 2026-07-19. Say how many were completed
and how many slipped, list anything still waiting on parts, and flag
anything that needs chasing.`;

const signal = AbortSignal.timeout(NIGHTLY.maxWallMs);
const session = reportSession();
const messages: MessageParam[] = [{ role: "user", content: BRIEF }];

const { reply, spent } =
  await runAgent(messages, session, NIGHTLY, signal);

for (const block of reply?.content ?? []) {
  if (block.type === "text") console.log(block.text);
}
console.log(
  `\n[${spent.steps} steps, ${spent.tokens} tokens, ${spent.ms} ms]`,
);
