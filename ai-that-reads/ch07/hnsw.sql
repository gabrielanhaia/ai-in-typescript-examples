-- ch07/hnsw.sql
--
-- NOT A LISTING FROM THE BOOK, and deliberately not applied by default.
--
-- Chapter 7's advice is "start with no index; add one when a measurement says
-- to", so `npm run db:setup` leaves this out unless you ask for it:
--
--   npm run db:setup -- --hnsw
--
-- The operator class here and the operator in your ORDER BY have to agree. This
-- book sorts by cosine distance (`<=>`) everywhere, so the class is
-- vector_cosine_ops. Get the pairing wrong and there is no error of any kind:
-- the planner quietly ignores the index. `npm run run-example -- ch07` shows
-- you both plans side by side.

CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);
