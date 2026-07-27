// ch07/store.ts
import { InMemoryStore } from "@langchain/langgraph";

const store = new InMemoryStore();
const ns = ["braxby", "customer", "cust_4417", "preferences"];

await store.put(ns, "contact", {
  channel: "email",
  language: "en-GB",
  updatedAt: new Date().toISOString(),
});

const item = await store.get(ns, "contact");
console.log(item?.value, item?.createdAt, item?.updatedAt);

// A prefix search: everything we know about this customer, not
// just their preferences.
const hits = await store.search(["braxby", "customer", "cust_4417"], {
  filter: { channel: "email" },
  limit: 50,
});
console.log(hits.map((h) => `${h.namespace.join("/")}:${h.key}`));
