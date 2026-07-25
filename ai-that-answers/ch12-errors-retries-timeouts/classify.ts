import { APIError, APIConnectionError } from "@anthropic-ai/sdk";

export type Action = "retry" | "fix" | "abandon";

export function classify(error: unknown, signal?: AbortSignal): Action {
  if (signal?.aborted) return "abandon";
  if (error instanceof Error && error.name === "AbortError") return "abandon";
  if (error instanceof APIConnectionError) return "retry";

  if (error instanceof APIError) {
    const status = error.status;
    if (status === undefined) return "retry";
    if (status === 429 || status >= 500) return "retry";
    return "fix";
  }

  return "abandon";
}
