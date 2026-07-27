// ch14/build.ts
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
import { buildAssistant } from "./graph.js";

const conn = process.env.DATABASE_URL;
if (!conn) throw new Error("DATABASE_URL is not set");

export const checkpointer = PostgresSaver.fromConnString(conn);
export const store = PostgresStore.fromConnString(conn, {
  // Minutes. A fact does not get truer because somebody read it.
  ttl: { defaultTtl: 60 * 24 * 180, refreshOnRead: false },
});

export const assistant = buildAssistant(checkpointer, store);
