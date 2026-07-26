// NOT A LISTING FROM THE BOOK.
//
// Chapter 12 without the model: the query the model would write against the
// message the customer typed, the second search that finds the part number,
// and the citation layer resolving what came back. Keyless, and it reaches
// nothing but `retrieval/index.json`.
import { citationsIn } from "./cited.js";
import { passagesFor } from "./passages.js";
import { searchDocs } from "./search-tool.js";
import { retrieve } from "../retrieval/retrieve.js";

const sources = new Map<string, string>();
const tool = searchDocs(sources);

console.log("=== the customer's words, and the query a model writes ===\n");
const asTyped =
  "my mate reckons i can get money off a new frame after i binned mine, " +
  "is that right? bought it back in march";
console.log(`  typed:  ${asTyped}`);
console.log(`  query:  crash replacement discount bare frame\n`);

for (const [label, query] of [
  ["as typed", asTyped],
  ["rewritten", "crash replacement discount bare frame"],
] as const) {
  const hits = await retrieve(query, 3);
  console.log(`  ${label}:`);
  for (const hit of hits) {
    const meta = hit.metadata as { title: string; section: string };
    console.log(`    ${hit.score.toFixed(2).padStart(6)}  ` +
      `[${meta.title}, ${meta.section}]`);
  }
}

console.log("\n=== searching twice ===\n");
for (const query of [
  "disc brake rub after rotor change",
  "rear adapter 180 mm Halvard R4",
]) {
  const text = await tool.invoke({ query });
  const first = text.split("\n")[0] ?? "";
  console.log(`  ${query}\n    -> ${first}`);
}

console.log("\n=== the source map after two searches ===\n");
for (const [label, chunkId] of sources) {
  console.log(`  ${label.padEnd(52)} ${chunkId}`);
}

console.log("\n=== resolving an answer's labels ===\n");
const answer =
  "Braxby covers a workshop-built wheel for 36 months " +
  "[Warranty policy, Term by category], and a faulty item is a warranty " +
  "claim rather than a return [Returns and refunds, Faulty items]. " +
  "See also [Warranty policy, Section 9].";

await tool.invoke({ query: "warranty term for a workshop-built wheel" });
await tool.invoke({ query: "item arrived damaged return or warranty claim" });

const { cited, unresolved } = citationsIn(answer, sources);
for (const one of cited) console.log(`  resolved   ${one.label} -> ${one.chunkId}`);
for (const one of unresolved) console.log(`  UNRESOLVED ${one}`);
console.log("\n  the unresolved list never goes into the answer.");

console.log("\n=== and when nothing matches ===\n");
console.log(passagesFor([], "zqx", new Map()));
