// PRINTED IN CHAPTER 8 as `ch08/credentials.ts`.
//
// The call to a token service is left as an ellipsis in the book; there is no
// such service here to reach. What matters is the shape — an audience field
// pinned to one call, and a ninety-second life.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";

export interface Scoped {
  readonly token: string;
  readonly scope: string;
  readonly audience: string;
  readonly ttlSeconds: number;
}

const SCOPE_FOR: Record<string, string> = {
  issue_refund: "refunds:write",
  book_workshop_slot: "workshop:book",
};

/** The run holds this for its whole life. It cannot write anything. */
export const READ_SCOPE = "orders:self stock:read workshop:slots";

/** Minted only after a reviewer approves, for one tool_use id, good for
 *  one call and ninety seconds. There is no long-lived write token. */
export async function mintWriteToken(
  call: ToolUseBlock,
  customerId: string,
): Promise<Scoped> {
  const scope = SCOPE_FOR[call.name];
  if (scope === undefined) {
    throw new Error(
      `${call.name} has no write scope and may not have one`,
    );
  }

  // ...POST to the token service with subject, scope,
  //    audience: call.id, ttl_seconds: 90
  return {
    token: `scoped-for-${customerId}`,
    scope,
    audience: call.id,
    ttlSeconds: 90,
  };
}
