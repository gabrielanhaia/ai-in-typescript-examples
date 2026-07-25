// ch03/load-markdown.ts
import { readFile } from "node:fs/promises";
import { Document } from "@langchain/core/documents";
import { contentHash } from "./hash.js";
import type { SourceDocument } from "./document.js";

const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

export async function loadMarkdown(
  path: string,
): Promise<SourceDocument> {
  const raw = await readFile(path, "utf8");
  const body = raw.replace(FRONT_MATTER, "").trim();
  const heading = /^#\s+(.+)$/m.exec(body);

  return new Document({
    pageContent: body,
    metadata: {
      sourceId: path,
      title: heading?.[1]?.trim() ?? path,
      type: "markdown",
      hash: contentHash(body),
      loadedAt: new Date().toISOString(),
    },
  });
}
