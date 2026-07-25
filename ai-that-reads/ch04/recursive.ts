// ch04/recursive.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import type { SourceDocument } from "../ch03/document.js";
import type { Chunk } from "./chunk.js";

export function makeSplitter(
  chunkSize: number,
  chunkOverlap: number,
): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n## ", "\n### ", "\n\n", "\n", ". ", " ", ""],
  });
}

export async function chunkDocument(
  doc: SourceDocument,
  chunkSize: number,
  chunkOverlap: number,
): Promise<Chunk[]> {
  const parts = await makeSplitter(chunkSize, chunkOverlap).splitText(
    doc.pageContent,
  );

  return parts.map(
    (text, i) =>
      new Document({
        pageContent: text,
        metadata: {
          ...doc.metadata,
          chunkIndex: i,
          chunkId: `${doc.metadata.sourceId}#${i}`,
        },
      }),
  );
}
