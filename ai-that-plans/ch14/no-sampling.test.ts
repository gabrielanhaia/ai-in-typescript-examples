// NOT A LISTING FROM THE BOOK.
//
// The build guard the top-level README promises for this chapter. A regular
// expression over this package's own files, run as a test, so the build
// stops. Types cannot catch this: they describe what the SDK will send, not
// what the model will accept, and `claude-sonnet-5` and `claude-opus-5` both
// return a 400 for a non-default sampling parameter.
//
// The walk starts at the package root, which is where the listings are:
// `ch01` … `ch14` and `shop/` sit at the top level, and there is no `src`
// directory to walk. A wrong path here is the worst kind of wrong, because a
// walk that finds nothing passes — which is what the second test is for.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKIP = new Set(["node_modules", ".git", "data", "dist"]);

function* sources(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sources(path);
    else if (path.endsWith(".ts")) yield path;
  }
}

const BANNED = /\b(temperature|top_p|top_k)\s*:/;

test("no listing sends a sampling parameter", () => {
  const offenders = [...sources(ROOT)]
    .filter((path) => BANNED.test(readFileSync(path, "utf8")))
    .map((path) => path.slice(ROOT.length));

  expect(offenders).toEqual([]);
});

test("the walk actually reaches the listings", () => {
  const walked = [...sources(ROOT)].map((path) => path.slice(ROOT.length));

  // A grep that finds nothing is a grep that passes. Both halves are
  // asserted: enough files, and the two files that would have to be
  // reached for the guard to mean anything.
  expect(walked.length).toBeGreaterThan(40);
  expect(walked).toContain("ch14/graph.ts");
  expect(walked).toContain("shop/tools.ts");
});
