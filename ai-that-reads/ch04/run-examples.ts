// NOT A LISTING FROM THE BOOK.
//
// Chapter 4's splitters are all exports. This runs each of them over the
// warranty paragraph the chapter prints, so every chunk count and boundary in
// the chapter is a number you can reproduce with no API key:
//
//   npm run run-example -- ch04
//
// The paragraph below is chapter 4's. It is a single 520-character line in the
// original and only wraps on the printed page, so the lines are rejoined with
// spaces before anything splits it. Leave the newlines in and the recursive
// splitter treats them as separators, and none of the counts below hold.
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { splitFixed } from "./fixed.js";
import { splitByHeading } from "./by-heading.js";
import { chunkDocument } from "./recursive.js";
import type { SourceDocument } from "../ch03/document.js";

const PARAGRAPH = [
  "Braxby Cycles warrants every frame it sells against defects in materials",
  "and workmanship for five years from the date of purchase. The warranty",
  "covers the original purchaser only and is not transferable. Wheels,",
  "drivetrain components, and finishing kit carry a two-year warranty.",
  "Consumable parts such as tyres, brake pads, chains, and cables are not",
  "covered. Claims require the original order number. A frame replaced",
  "under warranty is covered for the remainder of the original five-year",
  "term, not for a new five years.",
].join(" ");

function show(label: string, chunks: string[]): void {
  console.log(`${label}: ${chunks.length} chunks`);
  console.log(`  lengths  ${chunks.map((c) => c.length).join(", ")}`);
  const first = chunks[0];
  const second = chunks[1];
  if (first !== undefined) console.log(`  1 ends   ...${first.slice(-58)}`);
  if (second !== undefined) console.log(`  2 begins ${second.slice(0, 58)}...`);
  console.log();
}

console.log(`the paragraph is ${PARAGRAPH.length} characters\n`);

show("splitFixed(200, 0)", splitFixed(PARAGRAPH, 200, 0));
show("splitFixed(200, 40)", splitFixed(PARAGRAPH, 200, 40));

const plain = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 0,
});
show("recursive, default separators", await plain.splitText(PARAGRAPH));

const sentences = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 0,
  separators: ["\n\n", "\n", ". ", " ", ""],
});
show('recursive, with ". " added', await sentences.splitText(PARAGRAPH));

// The overlap surprise: chunkOverlap is a maximum applied while merging, not a
// stride. Ask for 40 and you may get none at all.
const asked = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 40,
  separators: ["\n\n", "\n", ". ", " ", ""],
});
show("recursive, chunkOverlap: 40", await asked.splitText(PARAGRAPH));

// The heading trail, and the tiny-chunk damage a size that is too small does
// to a document that is only 169 characters long.
const HEADED = [
  "## Frame warranty",
  "",
  "Carbon and alloy frames are covered for five years from the date of",
  "purchase. The warranty covers the original purchaser only and is not",
  "transferable.",
].join("\n");

const doc = new Document({
  pageContent: HEADED,
  metadata: {
    sourceId: "markdown/warranty-policy.md",
    title: "Warranty policy",
    type: "markdown",
    hash: "0000000000000000",
    loadedAt: new Date(0).toISOString(),
  },
}) as SourceDocument;

console.log(`the headed document is ${HEADED.length} characters\n`);

for (const size of [120, 200]) {
  const chunks = await chunkDocument(doc, size, 0);
  console.log(
    `heading-aware separators at ${size}: ` +
      `${chunks.length} chunks, lengths ${chunks
        .map((c) => c.pageContent.length)
        .join(", ")}`,
  );
  const head = chunks[0];
  if (head !== undefined) {
    console.log(`  first chunk: ${JSON.stringify(head.pageContent)}`);
  }
}

console.log("\nsplitByHeading, which carries the trail into the text\n");
const trailed = splitByHeading({
  ...doc,
  pageContent: `# Warranty policy\n\n${HEADED}`,
} as SourceDocument);
for (const chunk of trailed) {
  console.log(`  ${chunk.metadata.chunkId}`);
  console.log(
    chunk.pageContent
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n"),
  );
}
