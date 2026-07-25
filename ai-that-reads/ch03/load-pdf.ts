// ch03/load-pdf.ts
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import { Document } from "@langchain/core/documents";
import { contentHash } from "./hash.js";
import type { SourceDocument } from "./document.js";

export async function loadPdf(path: string): Promise<SourceDocument[]> {
  const parser = new PDFParse({ data: await readFile(path) });
  try {
    const result = await parser.getText({ pageJoiner: "" });
    const info = await parser.getInfo();
    const title = String(info.info?.Title ?? "").trim();
    const loadedAt = new Date().toISOString();

    return result.pages.map((page) => {
      const text = page.text.trim();
      return new Document({
        pageContent: text,
        metadata: {
          sourceId: path,
          title: title.length > 0 ? title : path,
          type: "pdf",
          page: page.num,
          hash: contentHash(text),
          loadedAt,
        },
      });
    });
  } finally {
    await parser.destroy();
  }
}
