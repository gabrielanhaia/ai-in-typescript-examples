// ch13/fingerprint.ts
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/** SHA-256 of the file's bytes, taken without parsing it. */
export async function fileHash(path: string): Promise<string> {
  const digest = createHash("sha256");
  for await (const block of createReadStream(path)) {
    digest.update(block as Buffer);
  }
  return digest.digest("hex").slice(0, 16);
}
