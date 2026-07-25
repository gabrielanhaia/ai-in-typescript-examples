import { APIError } from "@anthropic-ai/sdk";

export function describe(error: unknown): string {
  if (error instanceof APIError) {
    return [
      `status=${error.status ?? "none"}`,
      `type=${error.type ?? "none"}`,
      `request-id=${error.requestID ?? "none"}`,
      `retry-after=${error.headers?.get("retry-after") ?? "none"}`,
    ].join(" ");
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
