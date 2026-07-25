-- ch08/fts.sql
ALTER TABLE chunks
  ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX chunks_fts_idx ON chunks USING gin (fts);
