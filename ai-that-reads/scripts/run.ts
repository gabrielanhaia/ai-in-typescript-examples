// NOT A LISTING FROM THE BOOK.
//
// The entry point behind `npm run run-example -- ch03`.
//
//   run.ts ch03                  run the chapter's default listing
//   run.ts ch03/load-corpus      run a named listing in that chapter
//   run.ts ch03 some argument    pass arguments through to the listing
//   run.ts --list                show every chapter and every listing
//
// It is also where the credentials are checked, so the listings themselves
// stay exactly as they are printed in the book.
//
// Book 1 checked one API key. This book needs up to three providers and two
// containers, so every listing declares what it needs, by name, in the
// REQUIRES table below. A listing missing from that table is treated as
// needing everything its chapter's default needs, which is the safe
// direction to be wrong in.
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

/** Something a listing cannot run without. */
type Need = "anthropic" | "openai" | "cohere" | "postgres" | "qdrant";

interface Requirement {
  /** The environment variable, where there is one. */
  variable?: string;
  /** What to do about it, in one paragraph. */
  fix: string;
}

const REQUIREMENTS: Record<Need, Requirement> = {
  anthropic: {
    variable: "ANTHROPIC_API_KEY",
    fix:
      "This listing calls the answering model.\n" +
      "  1. cp ../.env.example ../.env   (in the repository root)\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n" +
      "Get a key at https://console.anthropic.com/.",
  },
  openai: {
    variable: "OPENAI_API_KEY",
    fix:
      "This listing calls the embedding model, which is a different vendor\n" +
      "from the answering model — chapter 5 explains why there is no version\n" +
      "of this application that runs on one key.\n" +
      "  1. cp ../.env.example ../.env   (in the repository root)\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n" +
      "Get a key at https://platform.openai.com/.",
  },
  cohere: {
    variable: "COHERE_API_KEY",
    fix:
      "This listing calls the reranker (chapter 9).\n" +
      "  1. cp ../.env.example ../.env   (in the repository root)\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n" +
      "Get a key at https://dashboard.cohere.com/.",
  },
  postgres: {
    variable: "DATABASE_URL",
    fix:
      "This listing needs the Postgres container from chapter 7.\n" +
      "  1. docker compose up -d        (in this directory)\n" +
      "  2. npm run db:setup            (creates the extension, tables, indexes)\n" +
      "  3. set DATABASE_URL in ../.env — the compose defaults are\n" +
      "     postgresql://braxby:braxby@localhost:5432/braxby",
  },
  qdrant: {
    fix:
      "This listing needs the Qdrant container from chapter 7.\n" +
      "  docker compose up -d           (in this directory)\n" +
      "It listens on http://localhost:6333, which is the default this repo\n" +
      "uses when QDRANT_URL is unset.",
  },
};

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
    main: "ungrounded",
    about: "The answer with no document behind it",
  },
  ch02: {
    dir: "ch02",
    main: "tiny-rag",
    about: "Retrieval by hand: embed, score, rank, answer",
  },
  ch03: {
    dir: "ch03",
    main: "run-examples",
    about: "Loaders for Markdown, HTML and PDF, and what each one loses",
  },
  ch04: {
    dir: "ch04",
    main: "run-examples",
    about: "Three splitters over the same paragraph",
  },
  ch05: {
    dir: "ch05",
    main: "pairs",
    about: "What similarity cannot see: negation, a changed number, a code",
  },
  ch06: {
    dir: "ch06",
    main: "run-examples",
    about: "A batched, cached, resumable index build",
  },
  ch07: {
    dir: "ch07",
    main: "operators",
    about: "pgvector: four distance operators, and whether the index is used",
  },
  ch08: {
    dir: "ch08",
    main: "run-examples",
    about: "Reciprocal rank fusion, worked",
  },
  ch09: {
    dir: "ch09",
    main: "run-examples",
    about: "Capping per source, on a candidate list that repeats itself",
  },
  ch10: {
    dir: "ch10",
    main: "run-examples",
    about: "The assembled prompt, and the four checks that need no model",
  },
  ch11: {
    dir: "ch11",
    main: "run-examples",
    about: "Markers to citations, and the markers the model invented",
  },
  ch12: {
    dir: "ch12",
    main: "run-examples",
    about: "recall@k and MRR over the shipped question set",
  },
  ch13: {
    dir: "ch13",
    main: "run-examples",
    about: "Scan, hash, plan, and the guard that refuses a mass delete",
  },
  ch14: {
    dir: "ch14",
    main: "cli",
    about: "The whole application: retrieve, generate, cite",
  },
};

// Every listing, and what it cannot run without. An empty array means it runs
// on a clean clone with no key, no container, and no network.
//
// This is written out one line per listing on purpose. Book 1 used a glob to
// keep a directory out of its keyless test suite, the directory was renamed,
// the glob silently stopped matching, and tests that spend money leaked into
// the suite that is not supposed to. Exact names, every time.
const REQUIRES: Record<string, Need[]> = {
  "ch01/ungrounded": ["anthropic"],
  "ch01/grounded": ["anthropic"],

  "ch02/cosine": [],
  "ch02/tiny-search": [],
  "ch02/run-examples": [],
  "ch02/embed": ["openai"],
  "ch02/tiny-rag": ["openai", "anthropic"],

  "ch03/document": [],
  "ch03/hash": [],
  "ch03/load-markdown": [],
  "ch03/load-html": [],
  "ch03/load-pdf": [],
  "ch03/scanned": [],
  "ch03/load-corpus": [],
  "ch03/run-examples": [],

  "ch04/fixed": [],
  "ch04/chunk": [],
  "ch04/by-heading": [],
  "ch04/recursive": [],
  "ch04/pages": [],
  "ch04/run-examples": [],
  "ch04/sweep": ["openai"],

  "ch05/shape": ["openai"],
  "ch05/pairs": ["openai"],

  "ch06/custom-embeddings": [],
  "ch06/file-cache": [],
  "ch06/embedder": ["openai"],
  "ch06/one-at-a-time": ["openai"],
  "ch06/embed-batch": ["openai"],
  "ch06/logged": ["openai"],
  "ch06/cache": ["openai"],
  "ch06/build-index": ["openai"],
  "ch06/usage": ["openai"],
  "ch06/run-examples": ["openai"],

  "ch07/pool": ["postgres"],
  "ch07/operators": ["postgres"],
  "ch07/sql-store": ["postgres"],
  "ch07/sources": ["postgres"],
  "ch07/pgvector-store": ["postgres", "openai"],
  "ch07/qdrant-store": ["qdrant", "openai"],

  "ch08/hit": [],
  "ch08/rrf": [],
  "ch08/run-examples": [],
  "ch08/keyword": ["postgres"],
  "ch08/filtered": ["postgres"],
  "ch08/dense": ["postgres", "openai"],
  "ch08/hybrid": ["postgres", "openai"],

  "ch09/diversity": [],
  "ch09/framework": [],
  "ch09/run-examples": [],
  "ch09/rerank": ["cohere"],
  "ch09/retrieve": ["postgres", "openai", "cohere"],

  "ch10/context": [],
  "ch10/prompt": [],
  "ch10/order": [],
  "ch10/run-examples": [],
  "ch10/answer": ["postgres", "openai", "cohere", "anthropic"],
  "ch10/budget": ["anthropic"],

  "ch11/identity": [],
  "ch11/render": [],
  "ch11/answer-key": [],
  "ch11/cite-check": [],
  "ch11/run-examples": [],
  "ch11/support": ["postgres"],
  "ch11/quote": ["postgres"],

  "ch12/questions": [],
  "ch12/match": [],
  "ch12/score": [],
  "ch12/run-examples": [],
  "ch12/measure": ["postgres", "openai", "cohere"],
  "ch12/triage": ["postgres", "openai", "cohere"],

  "ch13/fingerprint": [],
  "ch13/plan": [],
  "ch13/guard": [],
  "ch13/scan": [],
  "ch13/run-examples": [],
  "ch13/store": ["postgres"],
  "ch13/sync": ["postgres", "openai"],

  "ch14/config": [],
  "ch14/cli": ["postgres", "openai", "cohere", "anthropic"],
  "ch14/ask": ["postgres", "openai", "cohere", "anthropic"],
  "ch14/migrate": ["postgres", "qdrant", "openai"],
};

/** Directories that hold data rather than listings. */
const NOT_LISTINGS = new Set(["fixtures"]);

async function listingsIn(entry: Entry): Promise<string[]> {
  const files = await readdir(new URL(entry.dir, ROOT), {
    recursive: true,
    withFileTypes: true,
  });
  const found: string[] = [];

  for (const file of files) {
    if (!file.isFile()) continue;
    if (!file.name.endsWith(".ts") || file.name.endsWith(".test.ts")) continue;
    if (
      file.parentPath
        .split(path.sep)
        .some((segment) => NOT_LISTINGS.has(segment))
    ) {
      continue;
    }
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
const needs =
  REQUIRES[target] ?? REQUIRES[`${chapterKey}/${entry.main}`] ?? [];

const missing = needs.filter((need) => {
  const variable = REQUIREMENTS[need].variable;
  return variable !== undefined && (process.env[variable] ?? "") === "";
});

if (missing.length > 0) {
  const lines = missing.map((need) => {
    const requirement = REQUIREMENTS[need];
    return `${requirement.variable} is not set.\n${requirement.fix}`;
  });

  // Most chapters have something in them that runs on a clean clone. Say so
  // here rather than leaving a reader with nothing to try.
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
    `${target} cannot run yet.\n\n${lines.join("\n\n")}${alternative}\n\n` +
      "No credential is ever committed to this repository, and .env is\n" +
      "git-ignored.",
  );
  process.exit(1);
}

if (needs.includes("qdrant")) {
  console.error(
    "> this listing needs the Qdrant container: docker compose up -d\n",
  );
}

const file = new URL(`${entry.dir}/${listing}.ts`, ROOT);
console.error(`> ${entry.dir}/${listing}.ts\n`);

// Hand the listing a process.argv that looks like it was started directly, so
// a listing reading process.argv.slice(2) sees its own arguments and not
// "ch02".
process.argv = [process.argv[0] ?? "node", file.pathname, ...process.argv.slice(3)];

await import(pathToFileURL(file.pathname).href);
