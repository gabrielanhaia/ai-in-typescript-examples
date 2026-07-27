// NOT A LISTING FROM THE BOOK.
//
// "Try it", exercise 5 — Compact and lose something. The chapter says: run
// `compact` on a thread that mentions a specific part number, then ask a
// question that needs it. If the summary kept it, lower `maxTokens` on the
// summarizer to 256 and run it again.
//
// Lowering it is a one-word edit in ch07/compact.ts — the summarizer is
// declared there, and this file deliberately does not build a second one. Make
// the edit, run this again, and read what comes back.
//
// Needs ANTHROPIC_API_KEY. `compact` refuses to do anything under 40,000
// tokens, so this sends roughly 45,000 input tokens to claude-sonnet-5 — a
// real, if small, bill.
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { countTokensApproximately } from "langchain";
import type { State } from "./state.js";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "ANTHROPIC_API_KEY is not set. This example calls a model — set the key " +
      "in ../.env or the environment and run it again.",
  );
  process.exit(1);
}

// Deferred on purpose. A static import is hoisted above this file's first
// statement, and ch07/compact.ts constructs its summarizer at module scope —
// so importing it up top would throw the SDK's own error before the check
// above ever ran.
const { compact } = await import("./compact.js");

const PART = "HB-118";

const messages = [
  new HumanMessage(
    `The rear hub on my Verano is grinding. Order ORD-4471, frame VER-8802.`,
  ),
  new AIMessage(
    `In cover to 2027-11-03. The part you need is ${PART}, a rear hub from ` +
      `Fettle Components, GBP 68.40. Booked for Thursday, 09:00.`,
  ),
];

// Everything after this point is the pleasantries the summarizer is told to
// drop — and the bulk the guard in `compact` is waiting for.
const CHATTER =
  "Thanks very much for that, and sorry to keep going on about it. " +
  "It has been raining all week here, which cannot be helping the bearings. ";
for (let i = 0; i < 90; i++) {
  messages.push(new HumanMessage(`${CHATTER.repeat(12)} (message ${i})`));
  messages.push(new AIMessage(`Understood. ${CHATTER.repeat(12)}`));
}

const state: State = { messages, customerId: "cust_4417", known: [], summary: "" };
console.log(`  thread: ${messages.length} messages, about ` +
  `${countTokensApproximately(messages)} tokens`);

const update = await compact(state);
const summary = update.summary ?? "";

console.log(`\n--- summary ---\n${summary}\n---------------`);
// `Update["messages"]` is the reducer's input type, not an array type, so it
// takes a guard before it can be counted.
const written = Array.isArray(update.messages) ? update.messages.length : 0;
console.log(`  messages after compaction: ${written} ` +
  `(a tombstone plus the last six)`);
console.log(
  `\n  Did the summary keep ${PART}? ` +
    (summary.includes(PART) ? "yes." : "NO — and the source is gone."),
);
console.log(
  `  If it kept it, lower maxTokens on the summarizer in ch07/compact.ts to\n` +
    `  256 and run this again. That is the failure mode in the table, and it\n` +
    `  is much more persuasive when it happens to your own transcript.`,
);
