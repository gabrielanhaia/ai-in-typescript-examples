// PRINTED IN CHAPTER 14 as `ch14/agent.ts`.
//
// Chapter 4's thirty lines are still legible inside it. The `Run` shape and
// the client are not printed.
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { ToolContext } from "../ch06/context.js";
import type { Reviewer } from "../ch08/gate.js";
import { conclude, type Finished } from "../ch09/conclude.js";
import { Ledger } from "../ch09/limits.js";
import { Repeats, stalled } from "../ch09/repeats.js";
import { sessionFor } from "../ch12/session.js";
import { resultsFor } from "./batch.js";
import { LIMITS, MAX_TOKENS, MODEL } from "./config.js";
import { SYSTEM } from "./system.js";

const client = new Anthropic();

export interface Run extends Finished {
  readonly messages: MessageParam[];
  readonly sources: ReadonlyMap<string, string>;
}

export async function run(
  ctx: ToolContext,
  question: string,
  reviewer: Reviewer,
): Promise<Run> {
  const sources = new Map<string, string>();
  const session = sessionFor(ctx, sources);
  const ledger = new Ledger(LIMITS, ctx.signal);
  const repeats = new Repeats();
  const messages: MessageParam[] = [{ role: "user", content: question }];

  for (;;) {
    const stop = ledger.exceeded() ?? stalled(repeats);
    if (stop !== undefined) {
      const ended = await conclude(
        messages,
        session,
        stop,
        ledger,
        SYSTEM,
      );
      return { ...ended, messages, sources };
    }

    const reply = await client.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        tools: session.definitions,
        messages,
      },
      { signal: ctx.signal },
    );
    ledger.spend(reply.usage);

    if (reply.stop_reason !== "tool_use") {
      const why = { kind: "answered" } as const;
      return { reply, why, spent: ledger.spent, messages, sources };
    }

    messages.push({ role: "assistant", content: reply.content });
    const calls = reply.content.filter(
      (block) => block.type === "tool_use",
    );
    const results = await resultsFor(calls, session, reviewer, repeats);
    messages.push({ role: "user", content: results });
  }
}
