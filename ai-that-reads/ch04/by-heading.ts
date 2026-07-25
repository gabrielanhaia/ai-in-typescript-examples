// ch04/by-heading.ts
import { Document } from "@langchain/core/documents";
import type { SourceDocument } from "../ch03/document.js";
import type { Chunk } from "./chunk.js";

const HEADING = /^(#{1,6})\s+(.*)$/;

export function splitByHeading(doc: SourceDocument): Chunk[] {
  const trail: string[] = [];
  const chunks: Chunk[] = [];
  let body: string[] = [];
  let headings: string[] = [];

  const flush = (): void => {
    const text = body.join("\n").trim();
    body = [];
    if (text.length === 0) return;
    const i = chunks.length;
    chunks.push(
      new Document({
        pageContent: `${headings.join(" > ")}\n\n${text}`,
        metadata: {
          ...doc.metadata,
          headings: [...headings],
          chunkIndex: i,
          chunkId: `${doc.metadata.sourceId}#${i}`,
        },
      }),
    );
  };

  for (const line of doc.pageContent.split("\n")) {
    const match = HEADING.exec(line);
    if (match === null) {
      body.push(line);
      continue;
    }
    flush();
    trail.length = match[1].length - 1;
    trail[match[1].length - 1] = match[2].trim();
    headings = trail.filter((h) => h !== undefined);
  }
  flush();

  return chunks;
}
