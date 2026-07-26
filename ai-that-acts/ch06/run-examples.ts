// NOT A LISTING FROM THE BOOK.
//
// Chapter 6 exports and nothing else. This prints the two facts no single
// listing shows: how many tools the surface carries, and that building it for
// two different callers produces definitions that serialise the same.
//
// No key. No service either — nothing here calls a tool.
import { sessionFor } from "./session.js";

const one = sessionFor({
  customerId: "cust_4471",
  token: "token-for-4471",
  runId: "r_8f21",
  signal: AbortSignal.timeout(1_000),
});

const two = sessionFor({
  customerId: "cust_9002",
  token: "token-for-9002",
  runId: "r_8f22",
  signal: AbortSignal.timeout(1_000),
});

console.log(`${one.definitions.length} tools on the surface:\n`);
for (const definition of one.definitions) {
  console.log(`  ${definition.name}`);
}

const same =
  JSON.stringify(one.definitions) === JSON.stringify(two.definitions);
console.log(
  `\ntwo customers, two tokens, definitions byte-identical: ${same}`,
);
console.log("ctx appears in the closure and never in the definition.");
