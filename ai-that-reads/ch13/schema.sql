-- ch13/schema.sql
--
-- NOT A LISTING FROM THE BOOK. Chapter 13 prints both statements in prose,
-- under "Writing it back", without a file path over them.
--
-- Ordering matters and the book says so: the foreign key means a `sources` row
-- has to exist before any chunk that references it, so this file is applied
-- after ch07/schema.sql and before anything writes.

CREATE TABLE IF NOT EXISTS sources (
  source_id   text PRIMARY KEY,
  hash        text        NOT NULL,
  chunk_count integer     NOT NULL,
  indexed_at  timestamptz NOT NULL DEFAULT now()
);

-- Promotes "no chunk without its source" from something the application
-- remembers to do into something the database will not allow to be false. The
-- cascade is what lets chapter 13's `forgetSource` do its job in one statement.
ALTER TABLE chunks
  ADD CONSTRAINT chunks_source_fk
  FOREIGN KEY (source_id) REFERENCES sources (source_id)
  ON DELETE CASCADE;
