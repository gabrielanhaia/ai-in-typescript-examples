// ch13/fingerprint.ts
/** Order-independent JSON. Two states that differ only in key
 *  order must produce one string, or every snapshot looks new
 *  and the detector below never fires. */
export function stable(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1));
  const body = entries
    .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
    .join(",");
  return `{${body}}`;
}

/** Short, stable digest. Not cryptographic — it only has to be
 *  equal for equal states and short enough to sit in a column. */
export function fingerprint(state: unknown): string {
  const text = stable(state);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function pick(
  values: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = values[key];
  return out;
}
