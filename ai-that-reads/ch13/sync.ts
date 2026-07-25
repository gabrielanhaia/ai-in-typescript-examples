// ch13/sync.ts
import { loadFile } from "../ch03/load-corpus.js";
import { chunkPages } from "../ch04/pages.js";
import { embedChunks } from "../ch06/embed-batch.js";
import { refuseSuspiciousDeletes } from "./guard.js";
import { planRefresh } from "./plan.js";
import { scanCorpus } from "./scan.js";
import { forgetSource, indexedSources, replaceSource } from "./store.js";

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 135;

const onDisk = await scanCorpus("corpus", ["markdown", "html", "pdf"]);
const indexed = await indexedSources();
const plan = planRefresh(onDisk, indexed);

refuseSuspiciousDeletes(plan, indexed.length);

console.log(
  `${plan.unchanged.length} unchanged, ` +
    `${plan.changed.length} to re-index, ` +
    `${plan.deleted.length} to delete`,
);

for (const file of plan.changed) {
  const pages = await loadFile(file.path);
  // One identity, minted by the scan. A loader is handed one file and does
  // not know where the corpus starts, so it stamps the path it was given;
  // this is the stage that knows the root. Restamp before chunking, or
  // `chunkId` and the `source_id` column below name different documents.
  for (const page of pages) page.metadata.sourceId = file.sourceId;

  const chunks = await chunkPages(pages, CHUNK_SIZE, CHUNK_OVERLAP);

  const rows = await embedChunks(chunks);
  await replaceSource(file.sourceId, file.hash, rows);
  console.log(`  reindexed ${file.sourceId}  ${chunks.length} chunks`);
}

for (const sourceId of plan.deleted) {
  await forgetSource(sourceId);
  console.log(`  deleted    ${sourceId}`);
}
