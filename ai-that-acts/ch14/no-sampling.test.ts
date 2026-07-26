// PRINTED IN CHAPTER 14 as `ch14/no-sampling.test.ts`.
//
// A regular expression over this repository's own files, run as a test, so
// the build stops. Types cannot catch it: they describe what the SDK will
// send, not what the model will accept.
//
// ONE DEVIATION FROM THE PAGE: the chapter walks `"src"`. This repository has
// no `src` directory — chapter 14's own tree puts `ch02` … `ch14` at the top
// level, which is what makes `from "../ch04/loop.js"` resolve — so the walk
// starts at the package root instead. A wrong path here is the worst kind of
// wrong: a walk that finds nothing passes.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
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
  const offenders = [...sources(ROOT)].filter((path) =>
    BANNED.test(readFileSync(path, "utf8")),
  );

  expect(offenders).toEqual([]);
});

test("the walk actually reaches the listings", () => {
  const walked = [...sources(ROOT)];

  // A grep that finds nothing is a grep that passes. Both halves are
  // asserted: enough files, and the one file that would fail if the guard
  // were removed.
  expect(walked.length).toBeGreaterThan(60);
  expect(walked.some((path) => path.endsWith("ch04/loop.ts"))).toBe(true);
});
