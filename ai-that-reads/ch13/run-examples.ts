// NOT A LISTING FROM THE BOOK.
//
// The half of chapter 13 that needs no database and no key:
//
//   npm run run-example -- ch13
//
// `scanCorpus` walking the named folders and hashing bytes, `planRefresh`
// classifying against an index, and `refuseSuspiciousDeletes` throwing on a
// scan that came back short.
//
// The real freshness run is ch13/sync.ts, which needs Postgres and an
// embedding key:
//
//   npm run run-example -- ch13/sync
import { refuseSuspiciousDeletes } from "./guard.js";
import { planRefresh, type Indexed } from "./plan.js";
import { scanCorpus } from "./scan.js";

const started = performance.now();
const onDisk = await scanCorpus("corpus", ["markdown", "html", "pdf"]);
const walk = (performance.now() - started) / 1000;

console.log(
  `${onDisk.length} documents, hashed in ${walk.toFixed(2)}s\n`,
);
for (const file of onDisk.slice(0, 5)) {
  console.log(`  ${file.hash}  ${file.sourceId}`);
}
console.log(`  …and ${onDisk.length - 5} more\n`);

// The mistake the chapter describes finding: walk the corpus root recursively
// and filter by extension, and you index the file that documents the corpus.
const everything = await scanCorpus("corpus", ["."]);
console.log(
  `Walking "corpus" itself instead of the three folders finds ` +
    `${everything.length}, not ${onDisk.length}:\n` +
    everything
      .filter((file) => !onDisk.some((kept) => kept.sourceId === file.sourceId))
      .map((file) => `  ${file.sourceId}`)
      .join("\n") +
    "\n  — a sibling of the corpus, not a member of it, and a careful\n" +
    "  description of every planted trap and every answer.\n",
);

// With nothing indexed yet, every file falls into the "changed" bucket, which is
// why there is no separate first-build path to keep in step with this one.
console.log("planRefresh against an empty index\n");
const first = planRefresh(onDisk, []);
console.log(
  `  ${first.unchanged.length} unchanged, ${first.changed.length} to ` +
    `re-index, ${first.deleted.length} to delete`,
);

// The healthy steady state: everything matches.
const indexed: Indexed[] = onDisk.map((file) => ({
  sourceId: file.sourceId,
  hash: file.hash,
}));
const steady = planRefresh(onDisk, indexed);
console.log(
  `  ${steady.unchanged.length} unchanged, ${steady.changed.length} to ` +
    `re-index, ${steady.deleted.length} to delete   <- a healthy pass`,
);

// One document edited, one withdrawn, one added.
const drifted: Indexed[] = [
  ...indexed
    .slice(1)
    .map((row, i) =>
      i === 0 ? { ...row, hash: "0000000000000000" } : row,
    ),
  { sourceId: "markdown/withdrawn-2024.md", hash: "1111111111111111" },
];
const drift = planRefresh(onDisk, drifted);
console.log(
  `  ${drift.unchanged.length} unchanged, ${drift.changed.length} to ` +
    `re-index, ${drift.deleted.length} to delete   <- one edited, one new, one gone`,
);
console.log(`    to delete: ${drift.deleted.join(", ")}`);

// The guard. Any reason the walk comes back short reads, from in here, as a
// bulk removal — an unmounted share, a mistyped path, one folder whose
// permissions changed overnight.
console.log("\nthe guard\n");
try {
  refuseSuspiciousDeletes(drift, indexed.length);
  console.log(
    `  one deletion out of ${indexed.length} is under the threshold — it proceeds`,
  );
} catch (error) {
  console.log(`  ${(error as Error).message}`);
}

const emptyDisk = planRefresh([], indexed);
try {
  refuseSuspiciousDeletes(emptyDisk, indexed.length);
  console.log("  a scan that returned nothing was allowed through");
} catch (error) {
  console.log(`  ${(error as Error).message}`);
}
console.log(
  "\n  Overriding it takes a person, deliberately. A deliberate retirement\n" +
    "  and a storage mount that silently failed look identical from inside\n" +
    "  the process, and no amount of code closes that gap.",
);
