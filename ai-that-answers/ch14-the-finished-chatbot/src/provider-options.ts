import type { ChatModel } from "./model.js";

type CallOptions = NonNullable<Parameters<ChatModel["invoke"]>[1]>;

/**
 * Call options that exist on this provider's binding and not on the shared
 * interface. Every use of this function is a line that will not survive a
 * provider swap.
 */
export function providerOnly(options: Record<string, unknown>): CallOptions {
  return options as CallOptions;
}
