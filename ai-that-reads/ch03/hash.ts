// ch03/hash.ts
import { createHash } from "node:crypto";

export function contentHash(text: string): string {
  const hex = createHash("sha256").update(text, "utf8").digest("hex");
  return hex.slice(0, 16);
}
