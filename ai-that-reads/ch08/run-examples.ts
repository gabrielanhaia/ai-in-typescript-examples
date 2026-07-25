// NOT A LISTING FROM THE BOOK.
//
// Chapter 8's fusion is a pure function, so it runs on a clean clone with no
// key and no container:
//
//   npm run run-example -- ch08
//
// It reproduces the arithmetic the chapter does by hand — the bulletin at
// rank 1 on one list and rank 4 on the other beating the parts register at
// rank 1 on one list and absent from the other — and then shows the three
// properties of `fuse` the chapter says will bite you if you change them.
//
// The two searches themselves need Postgres and a key:
//
//   npm run run-example -- ch08/keyword "BRK-1180"
//   npm run run-example -- ch08/hybrid  "BRK-1180"
import { fuse } from "./rrf.js";
import type { Hit } from "./hit.js";

function hit(id: string, sourceId: string, score: number): Hit {
  return { id, sourceId, content: `${sourceId} …`, metadata: {}, score };
}

const BULLETIN = hit("41", "markdown/workshop-service-bulletins-2026.md", 0);
const REGISTER = hit("17", "markdown/superseded-parts-register.md", 0);
const CATALOGUE = hit("58", "pdf/catalogue-2026-brakes-spread.pdf", 0);
const COMPAT = hit("62", "pdf/compatibility-2026.pdf", 0);

// The keyword side found the bulletin and nothing else. The dense side found
// the look-alike codes first and the bulletin fourth.
const keyword = [BULLETIN];
const dense = [REGISTER, CATALOGUE, COMPAT, BULLETIN];

console.log("dense ranking\n");
dense.forEach((h, i) => console.log(`  ${i + 1}  ${h.sourceId}`));
console.log("\nkeyword ranking\n");
keyword.forEach((h, i) => console.log(`  ${i + 1}  ${h.sourceId}`));

console.log("\nfused, k = 60\n");
for (const [index, fused] of fuse([dense, keyword]).entries()) {
  console.log(`  ${index + 1}  ${fused.rrf.toFixed(6)}  ${fused.sourceId}`);
}

console.log(
  "\nThe bulletin scores 1/61 + 1/64 = " +
    `${(1 / 61 + 1 / 64).toFixed(6)}; the register scores 1/61 = ` +
    `${(1 / 61).toFixed(6)} and nothing more. Agreement between two kinds\n` +
    "of evidence beats enthusiasm from one, and neither retriever had to be\n" +
    "confident about anything.",
);

// What `k` is for, on a case where changing it changes the answer: a document
// both retrievers put third, against a document one retriever put first.
console.log("\nk damps the advantage of rank 1\n");
const loved = hit("90", "one/loved-by-a-single-retriever.md", 0);
const agreed = hit("91", "two/found-by-both.md", 0);
const filler = (n: number) => hit(`9${n}`, `filler/${n}.md`, 0);

const listA = [loved, filler(2), agreed];
const listB = [filler(3), filler(4), agreed];

for (const k of [0, 1, 10, 60, 600]) {
  const order = fuse([listA, listB], k);
  const first = order[0];
  console.log(
    `  k = ${String(k).padStart(3)}   winner: ${first?.sourceId.padEnd(36)}` +
      ` (${first?.rrf.toFixed(6)})`,
  );
}
console.log(
  "\nAt k = 0, rank 1 scores 1 and rank 3 scores a third, so being first on\n" +
    "one list beats being third on both — the opposite of what fusion is for.\n" +
    "At k = 60 the gap between rank 1 and rank 3 is under four per cent and\n" +
    "appearing on both lists dominates. That is the whole reason for the 60.",
);

// Absence costs a document nothing here — no zero, no floor rank, no penalty of
// any kind. So when one retriever comes back with nothing, which is what happens
// on most conversational questions, fusion simply hands back the other ranking.
console.log("\nwhen the keyword side returns nothing\n");
const degraded = fuse([dense, []]);
console.log(
  `  ${degraded.map((f) => f.sourceId.split("/")[1]).join("  ")}\n` +
    "  — the dense ranking, unharmed.",
);

// The key here is the row's primary key, never its content. Byte-identical
// passages living in two files therefore remain two results, which is the only
// reason a footnote can name the file the answer actually came from.
console.log("\ntwo rows, identical text\n");
const twins = fuse([
  [hit("101", "markdown/returns-and-refunds.md", 0)],
  [hit("102", "html/faq.html", 0)],
]);
console.log(
  `  ${twins.length} results: ${twins.map((f) => f.id).join(", ")}\n` +
    "  — @langchain/classic's EnsembleRetriever keys on pageContent and\n" +
    "  would have kept one of them, carrying its own metadata.",
);
