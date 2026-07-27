// ch11/usage.ts
import { isAIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

export interface Cost {
  messages: number;
  input: number;
  output: number;
  cacheRead: number;
}

export const empty = (): Cost => ({
  messages: 0,
  input: 0,
  output: 0,
  cacheRead: 0,
});

/** Messages carry an optional id. Where there is one we count a
 *  message once however many namespaces it surfaces in; where
 *  there is none it was made locally and appears only once. */
export function add(
  total: Cost,
  seen: Set<string>,
  messages: BaseMessage[],
): void {
  for (const m of messages) {
    if (m.id !== undefined) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
    }
    total.messages += 1;
    if (!isAIMessage(m)) continue;
    const u = m.usage_metadata;
    if (u === undefined) continue;
    total.input += u.input_tokens;
    total.output += u.output_tokens;
    total.cacheRead += u.input_token_details?.cache_read ?? 0;
  }
}
