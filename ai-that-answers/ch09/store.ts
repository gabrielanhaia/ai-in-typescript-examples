import { Triage } from "./schema.js";

export function storeTriage(input: unknown) {
  const result = Triage.safeParse(input);

  if (!result.success) {
    return { ok: false as const, issues: result.error.issues };
  }

  return { ok: true as const, value: result.data };
}
