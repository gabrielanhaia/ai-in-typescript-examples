// NOT A LISTING FROM THE BOOK.
//
// The entry point behind `npm run run-example -- ch05`.
//
//   run.ts ch05                  run the chapter's default listing
//   run.ts ch05/history          run a named listing in that chapter
//   run.ts ch05/run job-4817     pass arguments through
//   run.ts --list                show every chapter and every listing
//   run.ts --dry-run ch05/run    resolve and check, then stop without importing
//
// It is also where the prerequisites are checked — a key, a Postgres, or a
// store some earlier listing had to write first — so the listings themselves
// stay exactly as they are printed in the book.
//
// ---------------------------------------------------------------------------
// EVERY LISTING IS WRITTEN OUT BY NAME BELOW. Nothing here is ever resolved by
// a pattern: `--list` reads the table, and so does the dispatch. The one
// directory read in this file is the tripwire at the bottom of the tables,
// which compares them against the tree and throws — it decides nothing.
//
// Book 1 used a wildcard to keep a directory out of its keyless test suite, the
// directory was later renamed, the wildcard silently stopped matching, and
// tests that spend money leaked into the suite that is not supposed to spend
// anything. Nothing failed. Nothing warned. The suite just quietly stopped
// meaning what it said.
//
// So: exact names, every time — and a tripwire at the bottom of the tables that
// compares them against the tree and throws if the two have drifted. A wrong
// exact name fails loudly on the next run; a stale glob never fails at all.
// ---------------------------------------------------------------------------
import { readdirSync } from "node:fs";
import { access } from "node:fs/promises";
import { connect } from "node:net";
import { pathToFileURL } from "node:url";

/** Something a listing cannot run without. */
type Need = "anthropic" | "postgres";

interface Entry {
  /** Directory name, relative to this package root. */
  dir: string;
  /** Default listing for the chapter, relative to dir, without extension. */
  main: string;
  /** One line for `--list` and for the top-level README. */
  about: string;
}

const ROOT = new URL("..", import.meta.url);

const CHAPTERS: Record<string, Entry> = {
  ch01: {
    dir: "ch01",
    main: "main",
    about: "A plan, a file store and a loop, written by hand",
  },
  ch02: {
    dir: "ch02",
    main: "run",
    about: "The same job as two nodes and three edges",
  },
  ch03: {
    dir: "ch03",
    main: "supersteps",
    about: "Five channels, four merge behaviours, one collision",
  },
  ch04: {
    dir: "ch04",
    main: "run-examples",
    about: "The decision that is a function, and the four ways to wire it",
  },
  ch05: {
    dir: "ch05",
    main: "run",
    about: "Kill the process and see what survives",
  },
  ch06: {
    dir: "ch06",
    main: "run-examples",
    about: "Memory, SQLite and Postgres behind one factory",
  },
  ch07: {
    dir: "ch07",
    main: "run-examples",
    about: "The store beside the checkpointer, and what each one forgets",
  },
  ch08: {
    dir: "ch08",
    main: "pause",
    about: "A pause in front of the money, answered by another process",
  },
  ch09: {
    dir: "ch09",
    main: "first-stream",
    about: "Four stream modes, an SSE hub and thirty lines of browser",
  },
  ch10: {
    dir: "ch10",
    main: "run",
    about: "Reading past checkpoints, correcting them, and forking",
  },
  ch11: {
    dir: "ch11",
    main: "compare",
    about: "One agent, a supervisor and a swarm, counted",
  },
  ch12: {
    dir: "ch12",
    main: "split",
    about: "What the second agent costs, and the overlap report",
  },
  ch13: {
    dir: "ch13",
    main: "run-examples",
    about: "Two broken graphs, read back out of the checkpointer",
  },
  ch14: {
    dir: "ch14",
    main: "run-examples",
    about: "The whole assistant: plan, delegate, gate, stream, remember",
  },
};

// Every listing in the repository, and what it cannot run without. An empty
// array means it runs on a clean clone with no key, no container and no
// network. Names, not patterns — see the header.
//
// The rule behind the table, so it can be checked rather than believed:
//
//   * `[]` is a promise. Every listing declared free was run on a machine with
//     no key, no container and no network, and reached the end of the file.
//     Two exceptions are declared free and still exit non-zero, both by their
//     own design and both noted where they appear: `ch03/collide` throws the
//     collision it exists to show, and the listings that take a thread id print
//     their usage when you give them none.
//   * A non-empty array is what the listing needs to mean anything. Most of
//     those fail loudly without it — a chat model built at import, a query
//     issued on the first line — and the two that would merely do nothing
//     quietly (`ch04/plan`, `ch06/ownership`) are marked anyway, because
//     "succeeded, printed nothing" is not an answer worth suggesting to anyone.
//
// A file that only exports things — `ch08/pending`, `ch12/measure`, `ch10/at` —
// runs to completion and prints nothing, which is a legal and slightly boring
// success.
const REQUIRES: Record<string, Need[]> = {
  // --- ch01 -----------------------------------------------------------------
  "ch01/inspect": [],
  "ch01/state": [],
  "ch01/store": [],
  "ch01/run": [],
  "ch01/steps": [],
  "ch01/main": ["anthropic"],

  // --- ch02 -----------------------------------------------------------------
  "ch02/act": [],
  "ch02/complain": [],
  "ch02/state": [],
  "ch02/tools": [],
  // plan.ts builds the Opus binding at import, and graph.ts imports plan.ts,
  // so everything downstream of the graph needs a key to load at all.
  "ch02/plan": ["anthropic"],
  "ch02/graph": ["anthropic"],
  "ch02/draw": ["anthropic"],
  "ch02/run": ["anthropic"],
  "ch02/watch": ["anthropic"],

  // --- ch03 -----------------------------------------------------------------
  "ch03/collide": [],
  "ch03/collide-quiet": [],
  "ch03/duplicate": [],
  "ch03/name-clash": [],
  "ch03/narrow": [],
  "ch03/nodes": [],
  "ch03/older-forms": [],
  "ch03/plan-channel": [],
  "ch03/reset": [],
  "ch03/shop": [],
  "ch03/state": [],
  "ch03/supersteps": [],
  "ch03/walk": [],

  // --- ch04 -----------------------------------------------------------------
  // ch04/plan.ts builds its binding on FIRST CALL rather than at import, which
  // is why the graph, the drawings and run-examples all LOAD without a key —
  // and why plan.ts is still marked below: nothing it exports does anything
  // without one.
  "ch04/command-graph": [],
  "ch04/fanout": [],
  "ch04/graph": [],
  "ch04/limit": [],
  "ch04/nodes": [],
  "ch04/route": [],
  "ch04/run-examples": [],
  "ch04/state": [],
  "ch04/supplier": [],
  "ch04/tools": [],
  "ch04/plan": ["anthropic"],
  "ch04/run": ["anthropic"],

  // --- ch05 -----------------------------------------------------------------
  "ch05/drain": [],
  "ch05/durability": [],
  "ch05/graph": [],
  "ch05/history": [],
  "ch05/measure": [],
  "ch05/measured": [],
  "ch05/resume": [],
  "ch05/run": [],
  "ch05/shop": [],
  "ch05/state": [],
  "ch05/steps": [],

  // --- ch06 -----------------------------------------------------------------
  "ch06/checkpointer": [],
  "ch06/shop": [],
  "ch06/state": [],
  "ch06/run-examples": [],
  "ch06/forget": ["postgres"],
  // Its pool connects lazily, so `node ch06/ownership.ts` on a machine with no
  // container exits 0 having done nothing. Every function it exports is a
  // query; marked by what it is for.
  "ch06/ownership": ["postgres"],
  "ch06/setup-db": ["postgres"],
  "ch06/graph": ["anthropic"],
  "ch06/run": ["anthropic", "postgres"],

  // --- ch07 -----------------------------------------------------------------
  "ch07/forget": [],
  "ch07/namespaces": [],
  "ch07/recall": [],
  "ch07/run-examples": [],
  "ch07/shop": [],
  "ch07/state": [],
  "ch07/store": [],
  "ch07/window": [],
  "ch07/try-namespace": [],
  "ch07/try-truncation": [],
  "ch07/try-window": [],
  "ch07/compact": ["anthropic"],
  "ch07/graph": ["anthropic"],
  "ch07/plan": ["anthropic"],
  "ch07/remember": ["anthropic"],
  "ch07/try-compaction": ["anthropic"],
  "ch07/try-recall": ["anthropic"],
  "ch07/durable": ["postgres"],

  // --- ch08 -----------------------------------------------------------------
  "ch08/approval": [],
  "ch08/before": [],
  "ch08/checkpointer": [],
  "ch08/decide": [],
  "ch08/graph": [],
  "ch08/order-part": [],
  "ch08/pause": [],
  "ch08/pending": [],
  "ch08/replay": [],
  "ch08/resume": [],
  "ch08/shop": [],
  "ch08/state": [],

  // --- ch09 -----------------------------------------------------------------
  "ch09/encoded": [],
  "ch09/events": [],
  "ch09/first-stream": [],
  "ch09/graph": [],
  "ch09/hub": [],
  "ch09/measure": [],
  "ch09/progress": [],
  "ch09/server": [],
  "ch09/shop": [],
  "ch09/sse": [],
  "ch09/state": [],
  "ch09/suppliers": [],

  // --- ch10 -----------------------------------------------------------------
  // No model call anywhere in this chapter, on purpose: a chapter about
  // reading and correcting a run's history is only teachable if two runs of
  // one input produce the same history.
  "ch10/at": [],
  "ch10/branches": [],
  "ch10/fork": [],
  "ch10/graph": [],
  "ch10/history": [],
  "ch10/inspect": [],
  "ch10/patch": [],
  "ch10/replace": [],
  "ch10/run": [],
  "ch10/shop": [],
  "ch10/state": [],
  "ch10/steps": [],

  // --- ch11 -----------------------------------------------------------------
  "ch11/measure": [],
  "ch11/shop": [],
  "ch11/usage": [],
  // Every one of these builds a Sonnet or Opus binding at import.
  "ch11/compare": ["anthropic"],
  "ch11/handoffs": ["anthropic"],
  "ch11/nested": ["anthropic"],
  "ch11/router": ["anthropic"],
  "ch11/single": ["anthropic"],
  "ch11/specialists": ["anthropic"],
  "ch11/supervisor": ["anthropic"],
  "ch11/swarm": ["anthropic"],

  // --- ch12 -----------------------------------------------------------------
  "ch12/measure": [],
  "ch12/overlap": [],
  "ch12/split": [],
  "ch12/tasks": [],
  "ch12/tools": [],
  "ch12/compare": ["anthropic"],
  "ch12/single": ["anthropic"],
  "ch12/specialists": ["anthropic"],
  "ch12/team": ["anthropic"],

  // --- ch13 -----------------------------------------------------------------
  // ch13/plan.ts builds on first call, like ch04's, so every diagnostic in the
  // chapter loads and runs against ./ch13.sqlite with no key at all.
  "ch13/answer": [],
  "ch13/break-it": [],
  "ch13/checkpointer": [],
  "ch13/draw": [],
  "ch13/fingerprint": [],
  "ch13/graph": [],
  "ch13/inspect": [],
  "ch13/loop": [],
  "ch13/looping-graph": [],
  "ch13/nodes": [],
  "ch13/route": [],
  "ch13/run-examples": [],
  "ch13/seed": [],
  "ch13/shop": [],
  "ch13/stalled": [],
  "ch13/state": [],
  "ch13/swallowing-graph": [],
  "ch13/thread-budget": [],
  "ch13/tools": [],
  // Same shape as ch04's: built on first call, so every diagnostic here loads
  // without a key, and `fixedPlan` is what the chapter actually wires in.
  "ch13/plan": ["anthropic"],

  // --- ch14 -----------------------------------------------------------------
  "ch14/approval": [],
  "ch14/decide": [],
  "ch14/nodes": [],
  "ch14/route": [],
  "ch14/run-examples": [],
  "ch14/shop": [],
  "ch14/sse": [],
  "ch14/state": [],
  // env.ts is the module that throws the chapter's own missing-key message, so
  // it needs the key it is checking for.
  "ch14/env": ["anthropic"],
  "ch14/graph": ["anthropic"],
  "ch14/memory": ["anthropic"],
  "ch14/parts": ["anthropic"],
  "ch14/plan": ["anthropic"],
  "ch14/draw": ["anthropic"],
  "ch14/build": ["anthropic", "postgres"],
  "ch14/events": ["anthropic", "postgres"],
  "ch14/hub": ["anthropic", "postgres"],
  "ch14/server": ["anthropic", "postgres"],
  "ch14/setup-db": ["anthropic", "postgres"],
};

// A prerequisite that is neither a credential nor a container: a store some
// other listing in the same chapter has to write first. Without this a reader
// who runs the listings in the order the chapter prints them meets an ENOENT
// stack trace out of node:fs, which says nothing about what to do next.
const SEEDED_BY: Record<string, { path: string; by: string }> = {
  "ch01/inspect": { path: ".runs", by: "ch01/main" },

  // ch10/at is not here: it exports a function and opens nothing.
  "ch10/branches": { path: "ch10.sqlite", by: "ch10/run job-4818" },
  "ch10/fork": { path: "ch10.sqlite", by: "ch10/run job-4818" },
  "ch10/history": { path: "ch10.sqlite", by: "ch10/run job-4817" },
  "ch10/inspect": { path: "ch10.sqlite", by: "ch10/run job-4817" },
  "ch10/patch": { path: "ch10.sqlite", by: "ch10/run job-4817" },
  "ch10/replace": { path: "ch10.sqlite", by: "ch10/run job-4817" },

  "ch13/answer": { path: "ch13.sqlite", by: "ch13/run-examples" },
  "ch13/draw": { path: "ch13.sqlite", by: "ch13/run-examples" },
  "ch13/inspect": { path: "ch13.sqlite", by: "ch13/run-examples" },
};

// One listing is printed reading `DATABASE_URL` — the right name in an
// application that owns its own database — and this repository's Postgres is
// published under `PLANS_DATABASE_URL`, because Book 2 already uses the other
// name on another port. ch06 and ch14 bridge the two inside their own glue
// modules; ch07 is a single top-level listing with nowhere to put the
// assignment above the line that reads it, so its README bridges at the call
// site instead of editing the page. That is a deliberate decision and this is
// where it stops being a surprise.
const ENV_BRIDGE: Record<string, { variable: string; how: string }> = {
  "ch07/durable": {
    variable: "DATABASE_URL",
    how:
      'DATABASE_URL="${PLANS_DATABASE_URL:-postgresql://braxby:braxby@localhost:5433/braxby}" \\\n' +
      "  npm run run-example -- ch07/durable",
  },
};

// --- the tripwire ----------------------------------------------------------
//
// The guard the wildcard would not have given us: a listing on disk with no
// line in REQUIRES, or a line in REQUIRES naming a file that has been renamed
// away, fails here — before anything is dispatched — instead of quietly being
// treated as needing nothing.
function listingsOnDisk(): string[] {
  const found: string[] = [];
  for (const entry of Object.values(CHAPTERS)) {
    for (const file of readdirSync(new URL(entry.dir, ROOT))) {
      if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
      found.push(`${entry.dir}/${file.replace(/\.ts$/, "")}`);
    }
  }
  return found.sort();
}

function checkTables(): void {
  const onDisk = listingsOnDisk();
  const declared = Object.keys(REQUIRES).sort();
  const missing = onDisk.filter((key) => !declared.includes(key));
  const stale = declared.filter((key) => !onDisk.includes(key));

  if (missing.length > 0 || stale.length > 0) {
    throw new Error(
      "scripts/run.ts is out of date with the tree.\n" +
        (missing.length > 0
          ? `  on disk, undeclared: ${missing.join(", ")}\n`
          : "") +
        (stale.length > 0 ? `  declared, not on disk: ${stale.join(", ")}\n` : "") +
        "Add or correct the line in REQUIRES. This table is written out by " +
        "name on purpose; see the header of this file.",
    );
  }

  for (const [key, entry] of Object.entries(CHAPTERS)) {
    const target = `${key}/${entry.main}`;
    if (!(target in REQUIRES)) {
      throw new Error(`${key}'s default listing, ${target}, does not exist.`);
    }
  }

  for (const key of Object.keys(SEEDED_BY)) {
    if (!(key in REQUIRES)) {
      throw new Error(`SEEDED_BY names ${key}, which is not a listing.`);
    }
  }

  for (const key of Object.keys(ENV_BRIDGE)) {
    if (!(key in REQUIRES)) {
      throw new Error(`ENV_BRIDGE names ${key}, which is not a listing.`);
    }
  }
}

function listAll(): void {
  for (const [key, entry] of Object.entries(CHAPTERS)) {
    console.log(`\n${key}  ${entry.about}   (default: ${entry.main})`);
    for (const target of Object.keys(REQUIRES)) {
      if (!target.startsWith(`${key}/`)) continue;
      const needs = REQUIRES[target] ?? [];
      const seed = SEEDED_BY[target];
      const label = [
        needs.length > 0 ? `needs ${needs.join(", ")}` : "",
        seed === undefined ? "" : `after ${seed.by}`,
      ]
        .filter((part) => part !== "")
        .join(", ");
      console.log(`    ${target}${label === "" ? "" : `  (${label})`}`);
    }
  }
  console.log(
    "\nListings with nothing after them run on a clean clone: no key, no\n" +
      "container, no network.",
  );
}

function usage(): never {
  console.error(
    "Usage: npm run run-example -- [--dry-run] <chapter>[/<listing>] [arguments]\n" +
      `Chapters: ${Object.keys(CHAPTERS).join(" ")}\n` +
      "Run with --list to see every listing and what each one needs.",
  );
  process.exit(1);
}

/** The URL ch06/checkpointer.ts and ch14/env.ts settle on, resolved the same
 *  way here so the message names the port a reader is actually missing. */
function databaseUrl(): string {
  return (
    process.env.PLANS_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "postgresql://braxby:braxby@localhost:5433/braxby"
  );
}

async function postgresIsUp(): Promise<boolean> {
  const url = new URL(databaseUrl());
  const port = Number(url.port === "" ? 5432 : url.port);
  return new Promise((resolve) => {
    const socket = connect({ host: url.hostname, port });
    const settle = (answer: boolean) => {
      socket.destroy();
      resolve(answer);
    };
    socket.setTimeout(1_500);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(new URL(path, ROOT));
    return true;
  } catch {
    return false;
  }
}

checkTables();

// --dry-run resolves the target and checks its prerequisites, then stops
// without importing anything. It is how "every run command the book prints
// still resolves" is checked in one pass, including the ones that open a
// server or want a key.
const dryRun = process.argv[2] === "--dry-run";
if (dryRun) process.argv.splice(2, 1);

const argument = process.argv[2];

if (argument === undefined) usage();
if (argument === "--list") {
  listAll();
  process.exit(0);
}

const [chapterKey, ...rest] = argument.split("/");
const entry = chapterKey === undefined ? undefined : CHAPTERS[chapterKey];

if (entry === undefined || chapterKey === undefined) {
  console.error(`Unknown chapter: ${argument}`);
  usage();
}

const listing = rest.length > 0 ? rest.join("/") : entry.main;
const target = `${chapterKey}/${listing}`;

if (!(target in REQUIRES)) {
  console.error(
    `Unknown listing: ${target}\n` +
      `Run with --list to see every listing in ${chapterKey}.`,
  );
  process.exit(1);
}

const needs = REQUIRES[target] ?? [];
const missing: string[] = [];

if (needs.includes("anthropic") && (process.env.ANTHROPIC_API_KEY ?? "") === "") {
  missing.push(
    "ANTHROPIC_API_KEY is not set.\n" +
      "This listing calls the model, or builds something that does.\n" +
      "  1. cp ../.env.example ../.env      (in the repo root, or .env here)\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n" +
      "Get a key at https://console.anthropic.com/.",
  );
}

if (needs.includes("postgres") && !(await postgresIsUp())) {
  missing.push(
    `Nothing is listening at ${databaseUrl()}.\n` +
      "This listing checkpoints to Postgres.\n" +
      "  npm run db:up               (or: docker compose up -d)\n" +
      "It publishes on 5433, not 5432, so it cannot collide with Book 2's.",
  );
}

const seed = SEEDED_BY[target];
if (seed !== undefined && !(await exists(seed.path))) {
  missing.push(
    `${seed.path} does not exist yet.\n` +
      "This listing reads a store that an earlier listing writes.\n" +
      `  npm run run-example -- ${seed.by}`,
  );
}

const bridge = ENV_BRIDGE[target];
if (bridge !== undefined && (process.env[bridge.variable] ?? "") === "") {
  missing.push(
    `${bridge.variable} is not set.\n` +
      "This listing is printed reading that name, and this repository's\n" +
      "Postgres is published under PLANS_DATABASE_URL. Bridge the two at the\n" +
      "call site rather than editing the page:\n" +
      bridge.how,
  );
}

if (missing.length > 0) {
  const free = Object.keys(REQUIRES).filter(
    (key) =>
      key.startsWith(`${chapterKey}/`) &&
      REQUIRES[key]?.length === 0 &&
      SEEDED_BY[key] === undefined,
  );
  const alternative =
    free.length === 0
      ? ""
      : `\n\nThis chapter has ${free.length} listing${
          free.length === 1 ? "" : "s"
        } that need nothing at all:\n` +
        free.map((key) => `  npm run run-example -- ${key}`).join("\n");

  console.error(
    `${target} cannot run yet.\n\n${missing.join("\n\n")}${alternative}\n\n` +
      "No credential is ever committed to this repository, and .env is\n" +
      "git-ignored.",
  );
  process.exit(1);
}

const file = new URL(`${entry.dir}/${listing}.ts`, ROOT);

if (!(await exists(`${entry.dir}/${listing}.ts`))) {
  console.error(`${target} is declared but ${entry.dir}/${listing}.ts is gone.`);
  process.exit(1);
}

if (dryRun) {
  const needed = needs.length === 0 ? "nothing" : needs.join(", ");
  console.log(`${target.padEnd(24)} ok   needs ${needed}`);
  process.exit(0);
}

console.error(`> ${entry.dir}/${listing}.ts\n`);

// Hand the listing a process.argv that looks like it was started directly, so
// a listing reading process.argv.slice(2) sees its own arguments and not
// "ch05".
process.argv = [
  process.argv[0] ?? "node",
  file.pathname,
  ...process.argv.slice(3),
];

await import(pathToFileURL(file.pathname).href);
