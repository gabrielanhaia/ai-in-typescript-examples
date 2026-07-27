// NOT A LISTING FROM THE BOOK.
//
// "Try it", exercise 2 — Break the namespace. The chapter says: change one
// call site from `preferencesNs(id)` to a literal
// `["braxby", "customer", id, "prefs"]`, write with it, read with the
// function. No error, no warning, null.
//
// Keyless. Deterministic. Nothing here touches a graph or a model.
import { InMemoryStore } from "@langchain/langgraph";
import { preferencesNs } from "./namespaces.js";

const store = new InMemoryStore();
const id = "cust_4417";

// The odd call site out. "prefs", not "preferences" — and the store has no
// opinion about that whatsoever.
const literal = ["braxby", "customer", id, "prefs"];
await store.put(literal, "contact", { channel: "email" });

const viaFunction = await store.get(preferencesNs(id), "contact");
console.log(`  wrote to   ${literal.join("/")}`);
console.log(`  read from  ${preferencesNs(id).join("/")}`);
console.log(`  got back   ${String(viaFunction)}`);

// And the same write, made through the function, is found again.
await store.put(preferencesNs(id), "contact", { channel: "email" });
const found = await store.get(preferencesNs(id), "contact");
console.log(`  after writing through preferencesNs: ${JSON.stringify(found?.value)}`);

// Both entries now exist, one namespace apart, and only one is ever read.
const spaces = await store.listNamespaces({ prefix: ["braxby", "customer", id] });
console.log(`  namespaces that exist: ${spaces.map((n) => n.join("/")).join(", ")}`);
