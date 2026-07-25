-- ch08/filters.sql
--
-- NOT A LISTING FROM THE BOOK. Chapter 8 prints this statement in prose, under
-- "Filters narrow what is searchable", without a file path over it. It is here
-- so `npm run db:setup` applies it beside ch08/fts.sql.

CREATE INDEX IF NOT EXISTS chunks_type_idx ON chunks ((metadata->>'type'));
