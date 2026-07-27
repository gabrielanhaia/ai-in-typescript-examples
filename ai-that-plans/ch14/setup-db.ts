// ch14/setup-db.ts
//
// Named by the chapter, not printed by it: "Both of those create their own
// tables, and neither creates them here. `setup()` on each lives in
// `ch14/setup-db.ts`, run once as a deploy step — for the reason chapter 6
// gave, which is that the migration bookkeeping takes no lock, so two
// processes booting together against a fresh database can collide on it."
//
// So: two `setup()` calls, in order, and nothing else. It does not build a
// graph, it does not call a model, and it is safe to run twice.
import "./env.js";
import { checkpointer, store } from "./build.js";

// Four checkpoint tables.
await checkpointer.setup();

// The store's own tables, separately. Same database, same one-time
// deploy step, different migration bookkeeping.
await store.setup();

await checkpointer.end();
await store.stop();

console.log("checkpointer and store are ready");
