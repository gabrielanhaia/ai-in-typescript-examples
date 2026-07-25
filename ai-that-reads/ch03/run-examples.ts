// NOT A LISTING FROM THE BOOK.
//
// Every listing in chapter 3 is a loader that exports a function. This runs
// them over the shipped corpus and prints the four checks the chapter closes
// on, so the chapter has something to run with no API key and no container.
//
//   npm run run-example -- ch03
//
// The three folders are named explicitly rather than walking `corpus/`,
// because `corpus/README.md` is a sibling of the corpus and not a member of
// it — the mistake chapter 13 describes finding, in the section on `scanCorpus`.
import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";
import { loadCorpus } from "./load-corpus.js";
import { loadHtml } from "./load-html.js";
import { pagesWithoutText } from "./scanned.js";
import type { SourceDocument } from "./document.js";

const FOLDERS = ["corpus/markdown", "corpus/html", "corpus/pdf"];

const docs: SourceDocument[] = [];
for (const folder of FOLDERS) docs.push(...(await loadCorpus(folder)));

const files = new Set(docs.map((doc) => doc.metadata.sourceId));
console.log(`${files.size} documents, ${docs.length} loaded units`);
console.log("(a PDF is one unit per page, everything else is one per file)\n");

const byType = new Map<string, number>();
for (const doc of docs) {
  byType.set(doc.metadata.type, (byType.get(doc.metadata.type) ?? 0) + 1);
}
for (const [type, count] of [...byType].sort()) {
  console.log(`  ${type.padEnd(9)} ${count}`);
}

// Check one: the extremes of the length distribution. A suspiciously short unit
// is normally a parser that gave up; a suspiciously long one is normally two
// files that ran together.
const sorted = [...docs].sort(
  (a, b) => a.pageContent.length - b.pageContent.length,
);
const shortest = sorted[0];
const longest = sorted.at(-1);
console.log("\nshortest and longest loaded unit\n");
if (shortest !== undefined) {
  console.log(
    `  ${String(shortest.pageContent.length).padStart(6)}  ` +
      `${shortest.metadata.sourceId}` +
      `${shortest.metadata.page === undefined ? "" : ` p.${shortest.metadata.page}`}`,
  );
}
if (longest !== undefined) {
  console.log(
    `  ${String(longest.pageContent.length).padStart(6)}  ` +
      `${longest.metadata.sourceId}` +
      `${longest.metadata.page === undefined ? "" : ` p.${longest.metadata.page}`}`,
  );
}

// Check two: grep the extracted text for markup that should have been stripped.
console.log("\nmarkup that survived extraction\n");
const MARKUP = ["<div", "&nbsp;", "<script", "```yaml"];
for (const needle of MARKUP) {
  const hits = docs.filter((doc) => doc.pageContent.includes(needle));
  console.log(`  ${needle.padEnd(9)} ${hits.length} documents`);
}

// Check three: pages with no text layer. A scanned page extracts to nothing,
// nothing reports a problem, and the answer on it is never found.
console.log("\npages with no text layer\n");
const pdfs = new Map<string, SourceDocument[]>();
for (const doc of docs) {
  if (doc.metadata.type !== "pdf") continue;
  const pages = pdfs.get(doc.metadata.sourceId) ?? [];
  pages.push(doc);
  pdfs.set(doc.metadata.sourceId, pages);
}
let blank = 0;
for (const [sourceId, pages] of pdfs) {
  const empty = pagesWithoutText(pages);
  if (empty.length === 0) continue;
  blank += empty.length;
  console.log(
    `  ${sourceId}: ${empty.length} of ${pages.length} ` +
      `(pages ${empty.join(", ")})`,
  );
}
if (blank === 0) console.log("  none");

// Check four is a person reading, and no script does it for you. What a script
// can do is show the failure the chapter opens on: what `.text()` alone does to
// a table, and what the loader does instead.
const fragment = new URL("fixtures/fragment.html", import.meta.url);
const raw = await readFile(fragment, "utf8");

console.log("\nthe fragment, through $(\"body\").text() alone\n");
console.log(
  cheerio
    .load(raw)("body")
    .text()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `  ${line}`)
    .join("\n"),
);

const loaded = await loadHtml(fragment.pathname);
console.log("\nthe same fragment, through ch03/load-html.ts\n");
console.log(
  loaded.pageContent
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n"),
);
console.log(`\n  title: ${loaded.metadata.title}`);
