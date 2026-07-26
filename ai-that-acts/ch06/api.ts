// PRINTED IN CHAPTER 6 as `ch06/api.ts`, and again as
// `ch06/api.ts (continued)` — the second block is the headers on the POST.
//
// The `ApiOutcome` union and `apiPost`'s surrounding lines are not printed;
// the chapter shows the client's shape and the headers it sends.
import { BASE } from "../app/config.js";
import type { ToolContext } from "./context.js";

export type ApiOutcome =
  | { ok: true; body: unknown }
  | { ok: false; status: number; detail: string };

export async function apiGet(
  path: string,
  ctx: ToolContext,
): Promise<ApiOutcome> {
  const response = await fetch(new URL(path, BASE), {
    headers: { authorization: `Bearer ${ctx.token}` },
    signal: AbortSignal.any([ctx.signal, AbortSignal.timeout(8_000)]),
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      detail: (await response.text()).slice(0, 200),
    };
  }

  return { ok: true, body: await response.json() };
}

export async function apiPost(
  path: string,
  body: unknown,
  ctx: ToolContext,
): Promise<ApiOutcome> {
  const response = await fetch(new URL(path, BASE), {
    method: "POST",
    body: JSON.stringify(body),
    signal: AbortSignal.any([ctx.signal, AbortSignal.timeout(8_000)]),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ctx.token}`,
      "x-braxby-run": ctx.runId,
      "x-braxby-actor": "assistant",
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      detail: (await response.text()).slice(0, 200),
    };
  }

  return { ok: true, body: await response.json() };
}
