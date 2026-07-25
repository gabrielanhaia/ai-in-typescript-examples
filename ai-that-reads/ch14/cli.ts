// ch14/cli.ts
import { ask } from "./ask.js";

const question = process.argv.slice(2).join(" ").trim();

if (question.length === 0) {
  console.error(
    'usage: npx tsx ch14/cli.ts "your question"\n\n' +
      "Ingest the corpus first, if you have not:\n" +
      "  docker compose up -d\n" +
      "  npm run db:setup\n" +
      "  npx tsx ch13/sync.ts",
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

// Never swallow these. A rising count means the numbering the model is being
// shown has stopped being obvious — most often because some earlier stage
// changed how many chunks it forwards.
if (unknownMarkers.length > 0) {
  console.error(
    `\nunresolvable markers: [${unknownMarkers.join("], [")}] — the model ` +
      `cited sources it was not given`,
  );
}

process.exit(0);
