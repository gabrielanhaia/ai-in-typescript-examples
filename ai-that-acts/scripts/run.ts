// NOT A LISTING FROM THE BOOK.
//
// The entry point behind `npm run run-example -- ch04`.
//
//   run.ts ch04                  run the chapter's default listing
//   run.ts ch04/trace            run a named listing in that chapter
//   run.ts ch04 "where is ORD-4471?"   pass arguments through
//   run.ts --list                show every chapter and every listing
//
// It is also where the credentials and the sample service are checked, so
// the listings themselves stay exactly as they are printed in the book.
//
// This book needs at most one key and one container, so the REQUIRES table
// below is short. It is still written out one line per listing on purpose:
// Book 1 used a glob to keep a directory out of its keyless test suite, the
// directory was renamed, the glob silently stopped matching, and tests that
// spend money leaked into the suite that is not supposed to. Exact names,
// every time.
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BASE } from "../app/config.js";

/** Something a listing cannot run without. */
type Need = "anthropic" | "braxby";

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
  ch02: {
    dir: "ch02",
    main: "first-call",
    about: "One tool, one round trip, every block printed",
  },
  ch03: {
    dir: "ch03",
    main: "print-json-schema",
    about: "The schema the model actually receives",
  },
  ch04: {
    dir: "ch04",
    main: "run",
    about: "The agent loop, by hand, against three tasks",
  },
  ch05: {
    dir: "ch05",
    main: "run-examples",
    about: "A tool surface, and the god tool beside it",
  },
  ch06: {
    dir: "ch06",
    main: "run-examples",
    about: "Six tools, one context, byte-identical definitions",
  },
  ch07: {
    dir: "ch07",
    main: "run-examples",
    about: "Three classes of failure, and a batch that answers all three",
  },
  ch08: {
    dir: "ch08",
    main: "run-examples",
    about: "The reversibility ladder, the lanes, and the dry-run",
  },
  ch09: {
    dir: "ch09",
    main: "run-examples",
    about: "Three ceilings and a stall detector, fired one at a time",
  },
  ch10: {
    dir: "ch10",
    main: "run",
    about: "The same loop, with the framework",
  },
  ch11: {
    dir: "ch11",
    main: "round-trip",
    about: "An MCP client and server, over stdio, in one process tree",
  },
  ch12: {
    dir: "ch12",
    main: "run-examples",
    about: "Retrieval as a tool: the query, the second search, the labels",
  },
  ch13: {
    dir: "ch13",
    main: "run-examples",
    about: "The weekly report, without a loop",
  },
  ch14: {
    dir: "ch14",
    main: "cli",
    about: "The whole application: one question, one gate, one answer",
  },
};

// Every listing, and what it cannot run without. An empty array means it runs
// on a clean clone with no key, no container, and no network.
const REQUIRES: Record<string, Need[]> = {
  "ch02/tool": [],
  "ch02/capture": [],
  "ch02/report-failure": [],
  "ch02/first-call": ["anthropic"],
  "ch02/round-trip": ["anthropic"],
  "ch02/count-tokens": ["anthropic"],

  "ch03/schema": [],
  "ch03/define-tool": [],
  "ch03/orders": [],
  "ch03/toolbox": [],
  "ch03/print-json-schema": [],

  "ch04/system": [],
  "ch04/trace": [],
  "ch04/turn": [],
  "ch04/one-at-a-time": [],
  "ch04/split-results": [],
  "ch04/break-batch": ["anthropic"],
  "ch04/stale-id": ["anthropic"],
  "ch04/loop": ["anthropic"],
  "ch04/run": ["anthropic"],

  "ch05/digest": [],
  "ch05/god-tool": [],
  "ch05/surface": [],
  "ch05/run-examples": [],

  "ch06/context": [],
  "ch06/identity-antipattern": [],
  "ch06/summarise": [],
  "ch06/session": [],
  "ch06/toolbox": [],
  "ch06/run-examples": [],
  "ch06/api": ["braxby"],
  "ch06/book-slot": ["braxby"],

  "ch07/classify": [],
  "ch07/result": [],
  "ch07/result-shape": [],
  "ch07/streak": [],
  "ch07/attempt": [],
  "ch07/batch": [],
  "ch07/naive": [],
  "ch07/run-one": [],
  "ch07/run-examples": [],
  "ch07/refund": ["braxby"],

  "ch08/ladder": [],
  "ch08/policy": [],
  "ch08/audit": [],
  "ch08/gate": [],
  "ch08/plans": [],
  "ch08/cli": [],
  "ch08/batch": [],
  "ch08/credentials": [],
  "ch08/run-examples": [],

  "ch09/limits": [],
  "ch09/rates": [],
  "ch09/repeats": [],
  "ch09/batch": [],
  "ch09/framework-limits": [],
  "ch09/run": [],
  "ch09/run-examples": [],
  "ch09/conclude": ["anthropic"],
  "ch09/agent": ["anthropic"],

  "ch10/system": [],
  "ch10/tools": [],
  "ch10/hitl": [],
  "ch10/budget-middleware": [],
  "ch10/agent": ["anthropic"],
  "ch10/run": ["anthropic"],
  "ch10/observe": ["anthropic"],
  "ch10/tool-runner": ["anthropic"],

  "ch11/admit": [],
  "ch11/call": [],
  "ch11/connect": [],
  "ch11/register": [],
  "ch11/server": [],
  "ch11/round-trip": [],

  "ch12/cited": [],
  "ch12/passages": [],
  "ch12/search-tool": [],
  "ch12/session": [],
  "ch12/run-examples": [],

  "ch13/weekly-report": [],
  "ch13/report-tools": [],
  "ch13/run-examples": [],
  "ch13/covering-note": ["anthropic"],
  // Reads the diary in this process, so it needs a key and no container.
  "ch13/report-agent": ["anthropic"],

  "ch14/config": [],
  "ch14/system": [],
  "ch14/batch": [],
  "ch14/same-surface": [],
  "ch14/agent": ["anthropic", "braxby"],
  "ch14/cli": ["anthropic", "braxby"],
};

async function listingsIn(entry: Entry): Promise<string[]> {
  const files = await readdir(new URL(entry.dir, ROOT), {
    recursive: true,
    withFileTypes: true,
  });
  const found: string[] = [];

  for (const file of files) {
    if (!file.isFile()) continue;
    if (!file.name.endsWith(".ts") || file.name.endsWith(".test.ts")) continue;
    const directory = path.join(ROOT.pathname, entry.dir);
    const relative = path
      .join(path.relative(directory, file.parentPath), file.name)
      .replace(/\.ts$/, "");
    found.push(relative);
  }

  return found.sort();
}

async function listAll(): Promise<void> {
  for (const [key, entry] of Object.entries(CHAPTERS)) {
    console.log(`\n${key}  ${entry.about}   (default: ${entry.main})`);
    for (const listing of await listingsIn(entry)) {
      const target = `${key}/${listing}`;
      const needs = REQUIRES[target];
      const label =
        needs === undefined
          ? "  (not declared — treated as needing everything)"
          : needs.length === 0
            ? ""
            : `  needs ${needs.join(", ")}`;
      console.log(`    ${target}${label}`);
    }
  }
  console.log(
    "\nListings with nothing after them run on a clean clone: no key, no\n" +
      "container, no network.",
  );
}

function usage(): never {
  console.error(
    "Usage: npm run run-example -- <chapter>[/<listing>] [arguments]\n" +
      `Chapters: ${Object.keys(CHAPTERS).join(" ")}\n` +
      "Run with --list to see every listing and what each one needs.",
  );
  process.exit(1);
}

async function serviceIsUp(): Promise<boolean> {
  try {
    const response = await fetch(new URL("/health", BASE), {
      signal: AbortSignal.timeout(1_500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const argument = process.argv[2];

if (argument === undefined) usage();
if (argument === "--list") {
  await listAll();
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

// Undeclared listings are assumed to need everything the chapter's default
// needs, so a file added without a line in REQUIRES fails loudly rather than
// reaching a provider by accident.
const needs = REQUIRES[target] ?? REQUIRES[`${chapterKey}/${entry.main}`] ?? [];
const missing: string[] = [];

if (needs.includes("anthropic") && (process.env.ANTHROPIC_API_KEY ?? "") === "") {
  missing.push(
    "ANTHROPIC_API_KEY is not set.\n" +
      "This listing calls the model.\n" +
      "  1. cp .env.example .env      (in this directory, or the repo root)\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n" +
      "Get a key at https://console.anthropic.com/.",
  );
}

if (needs.includes("braxby") && !(await serviceIsUp())) {
  missing.push(
    `The Braxby service is not answering at ${BASE}.\n` +
      "This listing calls it.\n" +
      "  docker compose up -d         (in this directory)\n" +
      "or, on your own Node, in a second terminal:\n" +
      "  npm run app",
  );
}

if (missing.length > 0) {
  const free = Object.keys(REQUIRES).filter(
    (key) => key.startsWith(`${chapterKey}/`) && REQUIRES[key]?.length === 0,
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
console.error(`> ${entry.dir}/${listing}.ts\n`);

// Hand the listing a process.argv that looks like it was started directly, so
// a listing reading process.argv.slice(2) sees its own arguments and not
// "ch04".
process.argv = [
  process.argv[0] ?? "node",
  file.pathname,
  ...process.argv.slice(3),
];

await import(pathToFileURL(file.pathname).href);
