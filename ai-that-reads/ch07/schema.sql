-- ch07/schema.sql
--
-- NOT A LISTING FROM THE BOOK. Chapter 7 prints each of these statements on
-- its own page, in prose, without a file path over it. They are collected
-- here verbatim so that `npm run db:setup` can apply them in one go.
--
-- Applied first, before ch13/schema.sql and ch08/fts.sql.

-- Nothing enables the extension for you; run this once against each database.
CREATE EXTENSION IF NOT EXISTS vector;

-- Four ordinary columns and one unusual one. `source_id` gets promoted out of
-- the JSON and into a real column because chapter 13 needs a foreign key on it,
-- and constraints cannot be hung off a JSON expression — only indexes can.
CREATE TABLE IF NOT EXISTS chunks (
  id         bigserial PRIMARY KEY,
  source_id  text        NOT NULL,
  content    text        NOT NULL,
  metadata   jsonb       NOT NULL,
  embedding  vector(1536) NOT NULL
);

-- An expression index over the chunk ID, which is an identifier and not a
-- relationship, so it stays in the JSON. And an ordinary index on the column
-- chapter 13 deletes by, without which that delete is a sequential scan of the
-- whole corpus on every freshness run.
CREATE UNIQUE INDEX IF NOT EXISTS chunks_chunk_id_idx
  ON chunks ((metadata->>'chunkId'));
CREATE INDEX IF NOT EXISTS chunks_source_id_idx ON chunks (source_id);
