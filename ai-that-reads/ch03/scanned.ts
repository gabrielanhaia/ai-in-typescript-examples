// ch03/scanned.ts
import type { SourceDocument } from "./document.js";

/** Visible characters below which a PDF page has no text layer. */
const FLOOR = 100;

export function pagesWithoutText(pages: SourceDocument[]): number[] {
  return pages
    .filter((p) => p.pageContent.replace(/\s/g, "").length < FLOOR)
    .map((p) => p.metadata.page ?? 0);
}

export function reportEmptyPages(pages: SourceDocument[]): void {
  const empty = pagesWithoutText(pages);
  if (empty.length === 0) return;
  const sourceId = pages[0]?.metadata.sourceId ?? "(unknown)";
  console.warn(
    `${sourceId}: ${empty.length} of ${pages.length} pages have ` +
      `no text layer (pages ${empty.join(", ")}). ` +
      `Nothing on them is searchable.`,
  );
}
