// NOT A LISTING FROM THE BOOK.
//
// Chapter 7 makes three claims it says it verified by running them, and every
// one of them is the kind that costs an afternoon if you meet it by surprise.
// This runs all three against your own container, with no API key and no
// embedding call, on a temporary table that is dropped at the end:
//
//   docker compose up -d
//   npm run db:setup
//   npm run run-example -- ch07
//
//   1. All four distance operators, on two identical unit vectors. Three of
//      them return 0 and `<#>` returns -1, because it is the *negative* inner
//      product — the trap in the chapter.
//   2. `EXPLAIN` with the index's operator class matching the query's operator,
//      and then not matching. One plan says Index Scan and one says Seq Scan.
//      Nothing errors either way and both answers are correct; one is simply
//      doing all the work by hand.
//   3. The 2,000-dimension ceiling both index types impose. This is the limit
//      chapter 5 had in mind when it preferred a 1,536-dimension model to a
//      3,072-dimension one.
import { pool } from "./pool.js";

const DIMENSIONS = 3;

function unit(): string {
  return `[${[1, 0, 0].slice(0, DIMENSIONS).join(",")}]`;
}

async function plan(sql: string, parameters: unknown[]): Promise<string> {
  const { rows } = await pool.query<{ "QUERY PLAN": string }>(
    `explain ${sql}`,
    parameters,
  );
  return rows.map((row) => row["QUERY PLAN"]).join("\n");
}

try {
  await pool.query("drop table if exists ch07_demo");
  await pool.query(
    `create table ch07_demo (id bigserial primary key,
                             embedding vector(${DIMENSIONS}) not null)`,
  );
  // Enough rows that the planner has something to choose between.
  await pool.query(
    `insert into ch07_demo (embedding)
     select ('[' || (1.0 / (n + 1)) || ',' || (1.0 - 1.0 / (n + 1))
                 || ',0]')::vector
       from generate_series(1, 2000) as n`,
  );
  await pool.query("insert into ch07_demo (embedding) values ($1::vector)", [
    unit(),
  ]);
  await pool.query("analyze ch07_demo");

  console.log("four operators, two identical unit vectors\n");
  const { rows } = await pool.query<{
    l2: string;
    ip: string;
    cosine: string;
    l1: string;
  }>(
    `select $1::vector <-> $1::vector as l2,
            $1::vector <#> $1::vector as ip,
            $1::vector <=> $1::vector as cosine,
            $1::vector <+> $1::vector as l1`,
    [unit()],
  );
  const row = rows[0];
  console.log(`  <->  L2 (Euclidean)          ${row?.l2}`);
  console.log(`  <#>  negative inner product  ${row?.ip}   <- the trap`);
  console.log(`  <=>  cosine distance         ${row?.cosine}`);
  console.log(`  <+>  L1 (taxicab)            ${row?.l1}`);
  console.log(
    "\nEvery one of the four is a distance: nearer means a lower number.\n" +
      "Chapter 5's cosine *similarity* runs the other way, which is where the\n" +
      "sign errors come from. `<#>` carries a minus sign because a btree walks\n" +
      "ascending, so a bigger-is-better operator could never lead an index\n" +
      "scan at all.",
  );

  await pool.query(
    "create index ch07_demo_l2 on ch07_demo using hnsw (embedding vector_l2_ops)",
  );

  console.log("\nthe index is built for L2. Query it with L2:\n");
  console.log(
    (
      await plan(
        "select id from ch07_demo order by embedding <-> $1::vector limit 5",
        [unit()],
      )
    )
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
  );

  console.log("\nSame table, same index. Query it with cosine:\n");
  console.log(
    (
      await plan(
        "select id from ch07_demo order by embedding <=> $1::vector limit 5",
        [unit()],
      )
    )
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
  );
  console.log(
    "\nOne character in the operator, and one plan reads every row. Nothing\n" +
      "errored and both results were correct. Run EXPLAIN once after you\n" +
      "build an index and look for the words Index Scan.",
  );

  console.log("\nthe 2,000-dimension ceiling\n");
  await pool.query("drop table if exists ch07_wide");
  await pool.query(
    "create table ch07_wide (id bigserial primary key, embedding vector(3072))",
  );
  try {
    await pool.query(
      "create index on ch07_wide using hnsw (embedding vector_cosine_ops)",
    );
    console.log("  no error — this pgvector build has no such limit");
  } catch (error) {
    console.log(`  ERROR:  ${(error as Error).message}`);
    console.log(
      "\n  text-embedding-3-small at 1,536 fits. text-embedding-3-large at\n" +
        "  3,072 does not. Ask the larger model for fewer dimensions instead.",
    );
  }
} finally {
  await pool.query("drop table if exists ch07_demo");
  await pool.query("drop table if exists ch07_wide");
  await pool.end();
}
