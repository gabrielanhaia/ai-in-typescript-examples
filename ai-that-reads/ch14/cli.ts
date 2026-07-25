// NOT A LISTING FROM THE BOOK.
//
// Chapter 14 shows the application as `npx tsx src/ask.ts "How long is the
// warranty on a Wickhaven frame?"`, but the `ask.ts` it prints exports a
// function and has no command line in it — it is the seam, not the entry
// point, because chapter 10's split between `generate` and `answer` exists so
// that chapter 14 can get the retrieved passages back after the answer.
//
// This is the missing eight lines: read the question from the command line,
// call `ask`, print the answer and then its footnotes.
//
//   npm run run-example -- ch14 "How long is the warranty on a Wickhaven frame?"
//
// It needs all four credentials and an ingested corpus:
//
//   docker compose up -d
//   npm run db:setup
//   npm run run-example -- ch13/sync
import { ask } from "./ask.js";

const question = process.argv.slice(2).join(" ").trim();

if (question.length === 0) {
  console.error(
    'usage: npm run run-example -- ch14 "your question"\n\n' +
      "Ingest the corpus first, if you have not:\n" +
      "  docker compose up -d\n" +
      "  npm run db:setup\n" +
      "  npm run run-example -- ch13/sync",
  );
  process.exit(1);
}

const { text, cited, unknownMarkers } = await ask(question);

console.log(text);

if (cited.length > 0) {
  console.log();
  for (const citation of cited) {
    console.log(`[${citation.marker}]  ${citation.label}`);
    console.log(`     ${citation.chunkId}`);
  }
}

// Never swallow these. If they start appearing more often, the numbering the
// model is being shown has stopped being obvious — most often because some
// earlier stage changed how many chunks it forwards.
if (unknownMarkers.length > 0) {
  console.error(
    `\nunresolvable markers: [${unknownMarkers.join("], [")}] — the model ` +
      `cited sources it was not given`,
  );
}

process.exit(0);
