// The entry point behind `docker compose run ai-that-answers ch03`.
//
//   run.ts ch03                  run the chapter's default listing
//   run.ts ch03/store            run a named listing in that chapter
//   run.ts --list                show every chapter and every listing
//
// It is also where the API key is checked, so the listings themselves stay
// exactly as they are printed in the book.
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

interface Entry {
  /** Directory name, relative to this package root. */
  dir: string;
  /** Default listing for the chapter, relative to dir, without extension. */
  main: string;
  /** True when running the default listing calls the provider. */
  needsKey: boolean;
}

const ROOT = new URL("..", import.meta.url);

const CHAPTERS: Record<string, Entry> = {
  ch01: {
    dir: "ch01-what-an-llm-call-actually-is",
    main: "framework-call",
    needsKey: true,
  },
  ch02: {
    dir: "ch02-your-first-call-in-one-file",
    main: "ask",
    needsKey: true,
  },
  ch03: {
    dir: "ch03-messages-roles-and-history",
    main: "chat",
    needsKey: true,
  },
  ch04: {
    dir: "ch04-the-system-prompt",
    main: "ask",
    needsKey: true,
  },
  ch05: {
    dir: "ch05-sampling",
    main: "repeatability",
    needsKey: true,
  },
  ch06: {
    dir: "ch06-prompt-technique",
    main: "compare",
    needsKey: true,
  },
  ch07: {
    dir: "ch07-streaming-to-a-terminal",
    main: "stream-basic",
    needsKey: true,
  },
  ch08: {
    dir: "ch08-streaming-to-a-web-ui",
    main: "server",
    needsKey: true,
  },
  ch09: {
    dir: "ch09-structured-output-with-zod",
    main: "triage",
    needsKey: true,
  },
  ch10: {
    dir: "ch10-tokens-and-the-context-window",
    main: "three-ways",
    needsKey: true,
  },
  ch11: {
    dir: "ch11-cost-you-can-compute",
    main: "run-examples",
    needsKey: false,
  },
  ch12: {
    dir: "ch12-errors-retries-timeouts",
    main: "measure-retries",
    needsKey: true,
  },
  ch13: {
    dir: "ch13-when-not-to-use-an-llm",
    main: "run-examples",
    needsKey: false,
  },
  ch14: {
    dir: "ch14-the-finished-chatbot",
    main: "src/cli",
    needsKey: true,
  },
};

// Listings that construct no client and reach no provider. Everything not in
// here is treated as needing a key, which is the safe direction to be wrong in.
const KEYLESS = new Set([
  "ch03/sliding-window",
  "ch03/store",
  "ch04/assembled-prompt-antipattern",
  "ch04/prompt/index",
  "ch04/prompt/system",
  "ch04/prompt/system.en",
  "ch04/prompt/system.de",
  "ch06/checks",
  "ch06/inputs",
  "ch06/variants",
  "ch07/stop-reason",
  "ch07/utf8-split",
  "ch09/actions",
  "ch09/bad-and-good",
  "ch09/print-json-schema",
  "ch09/schema",
  "ch09/store",
  "ch10/usage",
  "ch11/budget",
  "ch11/cost",
  "ch11/enforce-budget",
  "ch11/rates",
  "ch11/run-examples",
  "ch11/simulate",
  "ch11/usage",
  "ch12/backoff",
  "ch12/classify",
  "ch12/deadlines",
  "ch12/describe",
  "ch12/finish",
  "ch12/policy",
  "ch13/catalogue",
  "ch13/part-number",
  "ch13/route",
  "ch13/run-examples",
  "ch13/shipping",
  "ch13/spans",
  "ch13/total",
  "ch13/verify",
  "ch14/src/config",
  "ch14/src/cost",
  "ch14/src/deadlines",
  "ch14/src/finish",
  "ch14/src/history",
  "ch14/src/prompt/system",
  "ch14/src/provider-options",
]);

async function listAll(): Promise<void> {
  for (const [key, entry] of Object.entries(CHAPTERS)) {
    console.log(`\n${key}  ${entry.dir}   (default: ${entry.main})`);
    const files = await readdir(new URL(entry.dir, ROOT), {
      recursive: true,
      withFileTypes: true,
    });
    for (const file of files) {
      if (!file.isFile()) continue;
      if (!file.name.endsWith(".ts") || file.name.endsWith(".test.ts")) continue;
      if (file.parentPath.includes(`${path.sep}samples`)) continue;
      const rel = path
        .join(path.relative(path.join(ROOT.pathname, entry.dir), file.parentPath), file.name)
        .replace(/\.ts$/, "");
      console.log(`    ${key}/${rel}`);
    }
  }
}

function usage(): never {
  console.error(
    "Usage: run.ts <chapter>[/<listing>]\n" +
      `Chapters: ${Object.keys(CHAPTERS).join(" ")}\n` +
      "Run with --list to see every listing.",
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
const needsKey = rest.length > 0 ? !KEYLESS.has(target) : entry.needsKey;

if (needsKey && (process.env.ANTHROPIC_API_KEY ?? "") === "") {
  console.error(
    `${target} calls the provider, and ANTHROPIC_API_KEY is not set.\n\n` +
      "  1. cp .env.example .env      (in the repository root)\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n\n" +
      "Get a key at https://console.anthropic.com/. No key is ever committed to\n" +
      "this repository, and .env is git-ignored.",
  );
  process.exit(1);
}

const file = new URL(`${entry.dir}/${listing}.ts`, ROOT);
console.error(`> ${entry.dir}/${listing}.ts\n`);

// Hand the listing a process.argv that looks like it was started directly, so a
// listing reading process.argv.slice(2) sees its own arguments and not "ch02".
process.argv = [process.argv[0] ?? "node", file.pathname, ...process.argv.slice(3)];

await import(pathToFileURL(file.pathname).href);
