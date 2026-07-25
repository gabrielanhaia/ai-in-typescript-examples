// ch04/chunk.ts
import type { Document } from "@langchain/core/documents";
import type { SourceMetadata } from "../ch03/document.js";

export interface ChunkMetadata extends SourceMetadata {
  /** Position of this chunk inside its source document, from 0. */
  chunkIndex: number;
  /** sourceId + position. Stable: ch. 11 cites, ch. 13 upserts. */
  chunkId: string;
  /** First and last page, PDFs only. Absent for Markdown and HTML. */
  pages?: [number, number];
}

export type Chunk = Document<ChunkMetadata>;
