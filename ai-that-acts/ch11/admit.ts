// PRINTED IN CHAPTER 11 as `ch11/admit.ts`.
//
// The `Allowed` shape is not printed: an allowlist of names you have read,
// and a length bound on the descriptions you forward.
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export interface Allowed {
  readonly names: string[];
  readonly maxDescription: number;
}

/** Discovery tells you what exists. This decides what the model sees. */
export function admit(
  definitions: readonly Tool[],
  allowed: Allowed,
): Tool[] {
  const kept = definitions.filter((definition) =>
    allowed.names.includes(definition.name),
  );

  const missing = allowed.names.filter(
    (name) => !kept.some((definition) => definition.name === name),
  );
  if (missing.length > 0) {
    throw new Error(`server no longer advertises: ${missing.join(", ")}`);
  }

  for (const definition of kept) {
    const description = definition.description ?? "";
    if (description.length > allowed.maxDescription) {
      throw new Error(
        `${definition.name}: description is too long to trust`,
      );
    }
  }

  return kept;
}
