// NOT A LISTING FROM THE BOOK.
//
// "Try it", exercise 3 — Watch `search` truncate. The chapter says: write
// forty facts into one namespace, call `store.search(ns)` with no options,
// and count what comes back. Then ask whether you could have told, from the
// result alone, that thirty were missing.
//
// Keyless. Deterministic.
import { InMemoryStore } from "@langchain/langgraph";
import { factsNs } from "./namespaces.js";

const store = new InMemoryStore();
const ns = factsNs("cust_4417");

for (let i = 1; i <= 40; i++) {
  await store.put(ns, `fact_${String(i).padStart(2, "0")}`, {
    text: `Fact number ${i} about this bike.`,
  });
}

const defaulted = await store.search(ns);
const asked = await store.search(ns, { limit: 100 });

console.log(`  wrote:                       40`);
console.log(`  search(ns):                  ${defaulted.length}`);
console.log(`  search(ns, { limit: 100 }):  ${asked.length}`);
console.log(`  first key back:              ${defaulted[0]?.key}`);
console.log(`  last key back:               ${defaulted.at(-1)?.key}`);
console.log(
  "  Nothing in the result says thirty are missing. No error, no flag,\n" +
    "  no count — a recall node would simply believe these ten are all.",
);
