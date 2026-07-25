// NOT A LISTING FROM THE BOOK.
//
//   npm run db:setup            extension, tables, lookup indexes, full-text
//   npm run db:setup -- --hnsw  the same, plus chapter 7's HNSW index
//
// The book prints its DDL in prose, one statement at a time, spread across
// chapters 7, 8 and 13. This applies the collected files in the one order that
// works: chunks before the foreign key that points at sources, and the
// generated `fts` column after the table it is generated from.
//
// The HNSW index is left out unless you ask for it, because chapter 7's advice
// is to start with an exact scan and add an index when a measurement says to.
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const ROOT = new URL("..", import.meta.url);

const FILES = [
  "ch07/schema.sql",
  "ch13/schema.sql",
  "ch08/fts.sql",
  "ch08/filters.sql",
];

const HNSW = "ch07/hnsw.sql";

/** Postgres codes for "this object is already there". */
const ALREADY = new Set([
  "42P07", // duplicate_table
  "42710", // duplicate_object — a constraint, an extension
  "42701", // duplicate_column
]);

/** Splits a file into statements. The book's DDL has no dollar-quoting in it. */
function statements(sql: string): string[] {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

const connectionString = process.env.DATABASE_URL;
if (connectionString === undefined || connectionString === "") {
  console.error(
    "DATABASE_URL is not set.\n\n" +
      "  1. docker compose up -d       (in this directory)\n" +
      "  2. put this in ../.env:\n" +
      "     DATABASE_URL=postgresql://braxby:braxby@localhost:5432/braxby",
  );
  process.exit(1);
}

const files = process.argv.includes("--hnsw") ? [...FILES, HNSW] : FILES;
const client = new Client({ connectionString });
await client.connect();

try {
  for (const name of files) {
    const sql = await readFile(new URL(name, ROOT), "utf8");
    for (const statement of statements(sql)) {
      const head = statement.split("\n")[0]?.slice(0, 66) ?? statement;
      try {
        await client.query(statement);
        console.log(`  applied  ${head}`);
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== undefined && ALREADY.has(code)) {
          console.log(`  present  ${head}`);
          continue;
        }
        throw error;
      }
    }
  }
  console.log(
    `\n${files.length} files applied. ` +
      (files.includes(HNSW)
        ? "HNSW index built."
        : "No vector index: chapter 7 starts exact. Add one with --hnsw."),
  );
} finally {
  await client.end();
}
