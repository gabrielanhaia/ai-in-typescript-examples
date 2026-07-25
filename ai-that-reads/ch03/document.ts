// ch03/document.ts
import type { Document } from "@langchain/core/documents";

export interface SourceMetadata {
  /** The document's identity: its path. Ch. 11 prints it in a citation. */
  sourceId: string;
  /** Human-readable heading for the citation, not the filename. */
  title: string;
  /** "pdf" | "markdown" | "html" — a metadata filter in ch. 8. */
  type: string;
  /** 1-based page, PDFs only. Everything else omits it. */
  page?: number;
  /** Heading trail, e.g. ["Warranty", "Frames"]. Prepended in ch. 4. */
  headings?: string[];
  /** SHA-256 of the loaded text. Finds duplicate documents. */
  hash: string;
  /** ISO-8601 timestamp of the load. Dates a chunk in the store. */
  loadedAt: string;
}

export type SourceDocument = Document<SourceMetadata>;
