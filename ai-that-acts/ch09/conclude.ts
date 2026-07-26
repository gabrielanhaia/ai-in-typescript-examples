// PRINTED IN CHAPTER 9 as `ch09/conclude.ts` — the final model call, and the
// four sentences in `WHY`.
//
// NOT PRINTED: the function around it, and the `Finished` shape every ending
// comes back as. The system prompt arrives as an argument rather than as an
// import, because chapter 14's finished prompt is chapter 4's plus two
// additions and the concluding call has to carry the same one the run did.
import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageParam,
} from "@anthropic-ai/sdk/resources/messages";
import type { Session } from "../ch06/session.js";
import type { Ledger, Stop } from "./limits.js";

const client = new Anthropic();

const WHY: Record<Stop["kind"], string> = {
  // Cancelled has no sentence. There is nobody there to read it, so that
  // case returns without a model call at all.
  cancelled: "",
  steps: "You have used every step available for this request.",
  tokens: "This conversation has reached its size limit.",
  clock: "This request has run out of time.",
  stalled:
    "You have called the same tool with the same arguments repeatedly.",
};

export interface Finished {
  readonly reply: Message | undefined;
  readonly why: Stop | { kind: "answered" };
  readonly spent: { steps: number; tokens: number; ms: number };
}

export async function conclude(
  messages: MessageParam[],
  session: Session,
  stop: Stop,
  ledger: Ledger,
  system: string,
): Promise<Finished> {
  if (stop.kind === "cancelled") {
    return { reply: undefined, why: stop, spent: ledger.spent };
  }

  const reply = await client.messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        `${system}\n\n${WHY[stop.kind]} Answer now with what you already ` +
        `know. Say plainly which part of the request you could not ` +
        `finish. Do not promise to keep working on it.`,
      tools: session.definitions,
      tool_choice: { type: "none" },
      messages,
    },
    { signal: AbortSignal.timeout(20_000) },
  );

  return { reply, why: stop, spent: ledger.spent };
}
