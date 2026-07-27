// ch06/checkpointer.ts
import { MemorySaver } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";

const { Pool } = pg;

export type Backend = "memory" | "sqlite" | "postgres";

/** Its own schema, so four checkpoint tables never collide with
 *  the application's own tables in "public". */
export const PG_OPTIONS = { schema: "braxby" };

/** One pool per process, sized on purpose. The library's own
 *  default is ten connections and an unbounded wait. */
let shared: pg.Pool | undefined;

export function pool() {
  shared ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  return shared;
}

/** Nothing here creates a table. Schema is a deploy step, and the
 *  reason is two paragraphs of this chapter. */
export function openCheckpointer(kind: Backend): BaseCheckpointSaver {
  switch (kind) {
    case "memory":
      return new MemorySaver();
    case "sqlite":
      return SqliteSaver.fromConnString("data/braxby.sqlite");
    case "postgres":
      return new PostgresSaver(pool(), undefined, PG_OPTIONS);
  }
}
// ch06/checkpointer.ts, continued
export async function closeCheckpointer(cp: BaseCheckpointSaver) {
  if (cp instanceof SqliteSaver) cp.db.close();
  // One pool for the process means one place that closes it,
  // including the pool this module handed to other modules.
  if (shared) await shared.end();
}

// ---------------------------------------------------------------------------
// NOT PRINTED IN THE BOOK. Two pieces of glue, both about this repository
// rather than about the chapter.
//
// 1. `SqliteSaver.fromConnString("data/braxby.sqlite")` above is a path
// relative to the working directory, and the driver will not create the
// directory — it fails to open the file instead. `data/` cannot be committed
// (the repository root git-ignores it, together with every store written into
// it), so a clean clone does not have one. One idempotent mkdir, here, in the
// file that owns the path.
import { mkdirSync } from "node:fs";

mkdirSync("data", { recursive: true });

// 2. `pool()` above reads `process.env.DATABASE_URL`, which is the right name
// in an application that owns its own database. Here it is already taken by
// another book in this repository: Book 2
// (ai-that-reads) publishes a Postgres on 5432 under that name, and the
// repository-root `.env.example` sets it. Book 4's own container publishes on
// 5433 under PLANS_DATABASE_URL, so that name wins here and the printed line
// above is left exactly as the page has it.
//
// Runs at import, before anything can call pool(), which reads the variable
// only when the first connection is asked for.
process.env.DATABASE_URL =
  process.env.PLANS_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://braxby:braxby@localhost:5433/braxby";
