// PRINTED IN CHAPTER 9 as `ch09/repeats.ts`.
//
// `stable` is not printed. It walks the value and emits object entries in
// sorted key order, so two calls whose arguments differ only in how the model
// happened to order them hash to the same string.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import type { Stop } from "./limits.js";

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([one], [two]) => one.localeCompare(two),
  );
  return `{${entries
    .map(([key, held]) => `${JSON.stringify(key)}:${stable(held)}`)
    .join(",")}}`;
}

export function signature(call: ToolUseBlock): string {
  return `${call.name}(${stable(call.input)})`;
}

export class Repeats {
  readonly #answers = new Map<string, string>();
  readonly #counts = new Map<string, number>();

  /** Called before the tool runs. Returns the earlier answer when this
   *  exact call has already been made in this run. */
  seen(call: ToolUseBlock): string | undefined {
    const key = signature(call);
    this.#counts.set(key, (this.#counts.get(key) ?? 0) + 1);
    return this.#answers.get(key);
  }

  remember(call: ToolUseBlock, content: string): void {
    this.#answers.set(signature(call), content);
  }

  /** The tool that has been asked the identical question too often. */
  stuckOn(limit = 3): string | undefined {
    for (const [key, count] of this.#counts) {
      if (count >= limit) return key.slice(0, key.indexOf("("));
    }
    return undefined;
  }
}

/** The stall as a `Stop`, so the loop can check it beside the
 *  ceilings. */
export function stalled(repeats: Repeats, limit = 3): Stop | undefined {
  const tool = repeats.stuckOn(limit);
  return tool === undefined ? undefined : { kind: "stalled", tool };
}
