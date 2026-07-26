// NOT A LISTING FROM THE BOOK.
//
// Chapter 9 replaces every part of chapter 4's loop — the ceilings, the stall
// detector, the ending — and never prints the assembled result, because
// chapter 14 does. This is that assembly at chapter 9's rung: ledger,
// repeats, `conclude`, and no gate, which is what chapter 13's agent version
// of the weekly report calls.
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { SYSTEM } from "../ch04/system.js";
import type { Session } from "../ch06/session.js";
import { resultsFor } from "./batch.js";
import { conclude, type Finished } from "./conclude.js";
import { Ledger, type Limits } from "./limits.js";
import { Repeats, stalled } from "./repeats.js";

const client = new Anthropic();

export async function runAgent(
  messages: MessageParam[],
  session: Session,
  limits: Limits,
  signal: AbortSignal,
): Promise<Finished> {
  const ledger = new Ledger(limits, signal);
  const repeats = new Repeats();

  for (;;) {
    const stop = ledger.exceeded() ?? stalled(repeats);
    if (stop !== undefined) {
      return conclude(messages, session, stop, ledger, SYSTEM);
    }

    const reply = await client.messages.create(
      {
        model: "claude-sonnet-5",
        max_tokens: 8192,
        system: SYSTEM,
        tools: session.definitions,
        messages,
      },
      { signal },
    );
    ledger.spend(reply.usage);

    if (reply.stop_reason !== "tool_use") {
      return { reply, why: { kind: "answered" }, spent: ledger.spent };
    }

    messages.push({ role: "assistant", content: reply.content });
    const calls = reply.content.filter((block) => block.type === "tool_use");
    messages.push({
      role: "user",
      content: await resultsFor(calls, session, repeats),
    });
  }
}
