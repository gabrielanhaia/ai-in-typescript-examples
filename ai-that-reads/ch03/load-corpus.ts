// ch03/load-corpus.ts
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { loadHtml } from "./load-html.js";
import { loadMarkdown } from "./load-markdown.js";
import { loadPdf } from "./load-pdf.js";
import { reportEmptyPages } from "./scanned.js";
import type { SourceDocument } from "./document.js";

/** Dispatch one file by extension. An array: a PDF is many pages. */
export async function loadFile(path: string): Promise<SourceDocument[]> {
  switch (extname(path).toLowerCase()) {
    case ".md":
    case ".markdown":
      return [await loadMarkdown(path)];
    case ".html":
    case ".htm":
      return [await loadHtml(path)];
    case ".pdf": {
      const pages = await loadPdf(path);
      reportEmptyPages(pages);
      return pages;
    }
    default:
      console.warn(`skipped (no loader): ${path}`);
      return [];
  }
}

export async function loadCorpus(
  root: string,
): Promise<SourceDocument[]> {
  const entries = await readdir(root, {
    recursive: true,
    withFileTypes: true,
  });
  const docs: SourceDocument[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    docs.push(...(await loadFile(join(entry.parentPath, entry.name))));
  }

  return docs;
}
