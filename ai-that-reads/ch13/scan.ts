// ch13/scan.ts
import { readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileHash } from "./fingerprint.js";

const INDEXABLE = new Set([".md", ".markdown", ".html", ".htm", ".pdf"]);

export interface OnDisk {
  /** Path relative to the corpus root. A document's stable identity. */
  sourceId: string;
  path: string;
  hash: string;
}

/** Walks only the named folders, so a stray README stays out of it. */
export async function scanCorpus(
  root: string,
  folders: string[],
): Promise<OnDisk[]> {
  const found: OnDisk[] = [];

  for (const folder of folders) {
    const entries = await readdir(join(root, folder), {
      recursive: true,
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!INDEXABLE.has(extname(entry.name).toLowerCase())) continue;

      const path = join(entry.parentPath, entry.name);
      found.push({
        sourceId: relative(root, path),
        path,
        hash: await fileHash(path),
      });
    }
  }

  return found;
}
