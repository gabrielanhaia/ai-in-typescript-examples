// ch04/pages.ts
import { Document } from "@langchain/core/documents";
import type { SourceDocument } from "../ch03/document.js";
import type { Chunk } from "./chunk.js";
import { makeSplitter } from "./recursive.js";

const JOIN = "\n\n";

/** Chunk a file's pages as one document, recording each chunk's range. */
export async function chunkPages(
  pages: SourceDocument[],
  chunkSize: number,
  chunkOverlap: number,
): Promise<Chunk[]> {
  const first = pages[0];
  if (first === undefined) return [];

  const starts: number[] = [];
  let text = "";
  for (const page of pages) {
    if (text.length > 0) text += JOIN;
    starts.push(text.length);
    text += page.pageContent;
  }

  const splitter = makeSplitter(chunkSize, chunkOverlap);
  const parts = await splitter.splitText(text);
  // The first page's number is not this chunk's, so it does not travel.
  const { page: _page, ...shared } = first.metadata;
  let cursor = 0;

  return parts.map((part, i) => {
    const found = text.indexOf(part, cursor);
    const start = found === -1 ? cursor : found;
    const end = start + part.length;
    cursor = start + 1;

    const spanned = pages.flatMap((page, j) =>
      starts[j] < end && (starts[j + 1] ?? text.length) > start
        ? (page.metadata.page ?? [])
        : [],
    );

    return new Document({
      pageContent: part,
      metadata: {
        ...shared,
        chunkIndex: i,
        chunkId: `${first.metadata.sourceId}#${i}`,
        ...(spanned.length > 0
          ? { pages: [spanned[0], spanned.at(-1)] as [number, number] }
          : {}),
      },
    });
  });
}
