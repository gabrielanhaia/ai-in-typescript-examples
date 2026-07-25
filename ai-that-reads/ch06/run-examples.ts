// NOT A LISTING FROM THE BOOK.
//
// Chapter 6's listings are all exports. This drives them:
//
//   npm run run-example -- ch06              one document, batched and cached
//   npm run run-example -- ch06 --all        the whole corpus
//   npm run run-example -- ch06 --slow       add the one-at-a-time comparison
//
// It calls the embedding endpoint, so it needs OPENAI_API_KEY and it costs
// money. One document is a fraction of a cent. `--all` is the number chapter 6
// tells you to write down.
//
// Run it twice. The second run is the point of the chapter: every key hits the
// cache in ch06/.vectors/ and the run costs nothing.
import { performance } from "node:perf_hooks";
import { loadFile } from "../ch03/load-corpus.js";
import { chunkPages } from "../ch04/pages.js";
import { scanCorpus } from "../ch13/scan.js";
import { buildIndex } from "./build-index.js";
import { embedChunks } from "./embed-batch.js";
import { embedSlowly } from "./one-at-a-time.js";
import { fileCache } from "./file-cache.js";
import { measureIndexCost } from "./usage.js";
import type { Chunk } from "../ch04/chunk.js";

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 135;

const all = process.argv.includes("--all");
const slow = process.argv.includes("--slow");

// The same ingestion path ch13/sync.ts takes, so the cache keys this run
// writes are the ones a real freshness run will hit.
const folders = all ? ["markdown", "html", "pdf"] : ["markdown/staff-handbook"];

const onDisk = await scanCorpus("corpus", folders);
const chunks: Chunk[] = [];
for (const file of onDisk) {
  chunks.push(
    ...(await chunkPages(await loadFile(file.path), CHUNK_SIZE, CHUNK_OVERLAP)),
  );
}

console.log(`${onDisk.length} documents, ${chunks.length} chunks\n`);

// The resumable build: work in slices, write each slice before starting the
// next. Kill it at any point and re-run it; the progress line tells you which
// it is doing.
console.log("build-index.ts, slice by slice\n");
const cache = fileCache(new URL(".vectors/", import.meta.url));
await buildIndex(chunks, cache);

// The batched build. The timing is printed for the reason chapter 6 gives:
// leave a figure unprinted and you will end up estimating it from memory.
console.log("\nembed-batch.ts, one call per batch\n");
await embedChunks(chunks.slice(0, Math.min(chunks.length, 96)));

if (slow) {
  console.log("\none-at-a-time.ts, the first ten chunks\n");
  const started = performance.now();
  await embedSlowly(chunks.slice(0, 10).map((chunk) => chunk.pageContent));
  const seconds = (performance.now() - started) / 1000;
  console.log(
    `10 chunks in ${seconds.toFixed(1)}s ` +
      `(${(10 / seconds).toFixed(1)} chunks/s)`,
  );
  console.log(
    "The ratio between that rate and the batched one is the whole\n" +
      "argument for batching. The token bill is identical.",
  );
}

// The three numbers a planning document needs. This drops to the provider's
// own client, because the framework returns vectors and nothing else.
console.log("\nusage.ts, the numbers to write down\n");
const started = performance.now();
const cost = await measureIndexCost(chunks.map((chunk) => chunk.pageContent));
const wall = (performance.now() - started) / 1000;

console.log(`  tokens      ${cost.tokens}`);
console.log(`  vectors     ${cost.vectors}`);
console.log(`  wall clock  ${wall.toFixed(1)}s`);
console.log(
  "\nTake the token count, find the current per-million rate, and store both\n" +
    "the rate and the day you looked it up next to your answer. Undated\n" +
    "figures are the ones people are still quoting long after they stopped\n" +
    "being true.",
);
