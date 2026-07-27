// ch07/durable.ts
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

const conn = process.env.DATABASE_URL;
if (!conn) throw new Error("DATABASE_URL is not set");

export const checkpointer = PostgresSaver.fromConnString(conn);
export const store = PostgresStore.fromConnString(conn, {
  // Minutes, not days. 180 days, and a sweeper that deletes
  // expired rows so nothing recalls them by accident.
  ttl: { defaultTtl: 60 * 24 * 180, refreshOnRead: false },
});

// Each of them creates its own tables. Run once, before the graph.
await checkpointer.setup();
await store.setup();
