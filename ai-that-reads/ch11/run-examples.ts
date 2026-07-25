// NOT A LISTING FROM THE BOOK.
//
// The half of chapter 11 that needs no database:
//
//   npm run run-example -- ch11
//
// `renderAnswer` turning markers into citations, the marker the model
// invented, the refusal that correctly renders no footnotes at all, and
// `scoreCitations` against the real answer key in corpus/questions.jsonl.
//
// The coverage check and the supporting span are SQL, so they need Postgres
// and an ingested corpus:
//
//   npm run run-example -- ch11/support
import { loadAnswerKey } from "./answer-key.js";
import { scoreCitations } from "./cite-check.js";
import { locationOf, type Citable } from "./identity.js";
import { renderAnswer } from "./render.js";

const SUPPLIED: Citable[] = [
  {
    chunkId: "markdown/staff-handbook/04-returns-desk.md#1",
    title: "Staff handbook, 4. The returns desk",
    headings: ["The returns desk", "The window"],
  },
  {
    chunkId: "pdf/terms-of-sale-2026.pdf#4",
    title: "Terms of sale 2026",
    pages: [2, 3],
  },
  {
    chunkId: "html/faq.html#0",
    title: "Returns and refunds — FAQ",
    headings: ["Returns"],
  },
];

console.log("locationOf, per source kind\n");
for (const meta of SUPPLIED) {
  const where = locationOf(meta);
  console.log(`  ${(where === "" ? "(nothing)" : where).padEnd(34)} ${meta.chunkId}`);
}
console.log(
  "\n  A PDF chunk that crossed a page break renders as a range, because\n" +
    "  chapter 4 concatenated the pages before cutting. Markdown and HTML\n" +
    "  have no pages, so the heading trail does the locating instead — the\n" +
    "  branch people forget until a citation renders as `p. undefined`.",
);

const CASES: [string, string][] = [
  [
    "a good answer",
    "The 30-day window runs from the delivery date recorded by the " +
      "carrier, not from the order date [1]. The terms of sale say the " +
      "carrier's record is determinative [2].",
  ],
  [
    "a marker the model invented",
    "The window is 30 days [1] and returns are free [7].",
  ],
  ["a refusal", "I don't know from the documents I have."],
  [
    "a contract violation",
    "Returns are free and take about a week to process.",
  ],
];

const REFUSAL = "I don't know from the documents I have.";

console.log("\n\nrenderAnswer\n");
for (const [label, answer] of CASES) {
  const { cited, unknownMarkers } = renderAnswer(answer, SUPPLIED);
  console.log(`  ${label}`);
  console.log(`    ${answer}`);
  for (const citation of cited) {
    console.log(`      [${citation.marker}]  ${citation.label}`);
  }
  if (cited.length === 0) {
    console.log(
      answer.includes(REFUSAL)
        ? "      no footnotes, and that is correct: this is a refusal"
        : "      no footnotes, and that is a CONTRACT VIOLATION — count it",
    );
  }
  if (unknownMarkers.length > 0) {
    console.log(`      unresolvable: [${unknownMarkers.join("], [")}]`);
  }
  console.log();
}

console.log(
  "  Only cited sources are listed. A footnote list carrying all three\n" +
    "  retrieved passages would tell the reader that three documents\n" +
    "  support the answer; one of them was a candidate you happened to\n" +
    "  retrieve.\n",
);

// The near-duplicate measurement, against the shipped answer key.
const key = await loadAnswerKey("corpus/questions.jsonl");
const question = key.find((entry) => entry.id === "q01");

if (question !== undefined) {
  console.log("\nscoreCitations, on the real answer key\n");
  console.log(`  ${question.id}  ${question.question}`);
  console.log(`  authoritative: ${question.authoritative}`);
  console.log(
    `  supporting:    ${question.supporting.map((s) => s.file).join(", ")}\n`,
  );

  const attempts: [string, string][] = [
    ["cites the authoritative file", "markdown/returns-and-refunds.md#2"],
    ["cites a supporting near-duplicate", "html/faq.html#0"],
    ["cites something else entirely", "markdown/shipping-and-delivery.md#1"],
  ];

  for (const [label, chunkId] of attempts) {
    const result = scoreCitations(question, [
      { marker: 1, chunkId, label: "" },
    ]);
    console.log(
      `  ${label.padEnd(36)} authoritative=${String(
        result.citedAuthoritative,
      ).padEnd(5)} supporting=${result.citedSomethingSupporting}`,
    );
  }

  console.log(
    "\n  The middle row is the failure this chapter opened with: an answer\n" +
      "  that is right, citing a passage that does not carry the claim. It\n" +
      "  passes the supported rate and fails the authoritative rate, which\n" +
      "  is why the two are reported separately.",
  );
}
