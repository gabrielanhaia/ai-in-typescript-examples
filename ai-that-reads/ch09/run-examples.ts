// NOT A LISTING FROM THE BOOK.
//
// The half of chapter 9 that needs no model:
//
//   npm run run-example -- ch09
//
// `capPerSource` is the five-line answer to the problem reranking creates —
// four chunks that all state the thirty-day window, scored highly because all
// four *are* highly relevant, filling the prompt with restatements of one
// fact. The candidate list below is that situation.
//
// The reranker itself needs COHERE_API_KEY, Postgres and an embedding key:
//
//   npm run run-example -- ch09/retrieve "when does the returns window start"
import { capPerSource } from "./diversity.js";

interface Candidate {
  sourceId: string;
  relevance: number;
  says: string;
}

// One document contributing five adjacent chunks about the same clause is the
// usual shape of the redundancy, and it is what the cap is for.
const RANKED: Candidate[] = [
  {
    sourceId: "markdown/staff-handbook/04-returns-desk.md",
    relevance: 0.94,
    says: "runs from the delivery date the carrier recorded",
  },
  {
    sourceId: "markdown/staff-handbook/04-returns-desk.md",
    relevance: 0.91,
    says: "thirty days to send something back",
  },
  {
    sourceId: "markdown/staff-handbook/04-returns-desk.md",
    relevance: 0.88,
    says: "the desk checks the packaging first",
  },
  {
    sourceId: "pdf/terms-of-sale-2026.pdf",
    relevance: 0.86,
    says: "clause 5.2: the carrier record is determinative",
  },
  {
    sourceId: "html/faq.html",
    relevance: 0.84,
    says: "30 days from the day your order arrives",
  },
  {
    sourceId: "markdown/returns-and-refunds.md",
    relevance: 0.79,
    says: "an unused item within 30 days of delivery",
  },
];

function show(label: string, hits: Candidate[]): void {
  console.log(`${label}\n`);
  for (const [index, hit] of hits.entries()) {
    console.log(
      `  ${index + 1}  ${hit.relevance.toFixed(2)}  ` +
        `${hit.sourceId.padEnd(46)}  ${hit.says}`,
    );
  }
  console.log();
}

show("what the reranker returned, top 5", RANKED.slice(0, 5));
show("capPerSource(hits, 2), then top 5", capPerSource(RANKED, 2).slice(0, 5));

console.log(
  "Three of the top five came from one document and said nearly the same\n" +
    "thing. Capping at two per source spends those slots on the terms of\n" +
    "sale and the customer policy instead — no model call, five lines.\n\n" +
    "It belongs between the reranker and the prompt builder, and the cap is\n" +
    "one more value to read off the sweep that fixed prompt k.",
);

// The score is a model output, not a calibrated probability. It is worth
// logging and it is not worth thresholding on.
console.log("\nwhy not just threshold at 0.85\n");
const kept = RANKED.filter((hit) => hit.relevance >= 0.85);
console.log(
  `  ${kept.length} of ${RANKED.length} survive, and the two that carry the\n` +
    "  discriminating detail are split across the boundary. 0.85 is not\n" +
    "  eighty-five per cent of anything. Derive a threshold from your own\n" +
    "  question set or use the answer contract instead.",
);
