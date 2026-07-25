// ch07/pool.ts
import { Pool } from "pg";
import pgvector from "pgvector/pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Awaited before the connection is handed out, so no query can beat it.
  onConnect: async (client) => {
    await pgvector.registerTypes(client);
  },
});
