// ch06/setup-db.ts
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PG_OPTIONS, pool } from "./checkpointer.js";

const db = pool();
const checkpointer = new PostgresSaver(db, undefined, PG_OPTIONS);

// Creates the schema, then the four tables, in order, once.
await checkpointer.setup();

// The checkpoint tables do not record who a thread belongs to.
// This one does, and it is ours to create and ours to maintain.
await db.query(`
  CREATE TABLE IF NOT EXISTS braxby.thread_owner (
    thread_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS thread_owner_customer
    ON braxby.thread_owner (customer_id);
`);

await checkpointer.end();
console.log("schema braxby is ready");
