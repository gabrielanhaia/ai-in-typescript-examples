import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig } from "vitest/config";

// The default suite, and the one CI runs: no network, no key, no container,
// no Docker, milliseconds. `npm run verify` runs exactly this, and there is no
// second suite in this book — everything worth asserting here is either a pure
// function or a graph over a MemorySaver.
//
// Every test file in the repository is listed here by exact path. Book 1 was
// bitten by the alternative: it excluded `ch05/**` from this suite, the
// directory it meant was later renamed, the glob silently stopped matching,
// and a test that spends money leaked into the suite that is not supposed to
// spend anything. A wrong exact path fails loudly; a stale glob does not fail
// at all. The same rule governs `scripts/run.ts`.
//
// SEVEN files are expected here:
//   ch03/channels.test.ts     11 tests  the four merge behaviours, and the
//                                       collision a last-value channel throws
//   ch04/route.test.ts         3 tests  the decision, as a pure function
//   ch08/decide.test.ts        5 tests  all three answers, and the JSON boundary
//   ch08/gate.test.ts          2 tests  the edit branch; the pause is in front
//                                       of the money
//   ch10/timetravel.test.ts   15 tests  an edit is an append; asNode is the
//                                       program counter; a fork moves the head
//   ch13/detect.test.ts       15 tests  fingerprint, findRepeat, pendingPause,
//                                       and all three loop causes
//   ch14/assembly.test.ts      4 tests  three routes, one report, an idempotent
//                                       advance, a refusal that is an outcome
//   ch14/no-sampling.test.ts   2 tests  the grep, and that the grep walks
export const KEYLESS = [
  "ch03/channels.test.ts",
  "ch04/route.test.ts",
  "ch08/decide.test.ts",
  "ch08/gate.test.ts",
  "ch10/timetravel.test.ts",
  "ch13/detect.test.ts",
  "ch14/assembly.test.ts",
  "ch14/no-sampling.test.ts",
];

// The guard the glob did not give Book 1: a test file that exists and is not
// in the list, or a listed file that has been renamed, fails at config load
// rather than by quietly not running.
const ROOT = new URL(".", import.meta.url).pathname;
const SKIP = new Set(["node_modules", ".git", "data", "dist"]);

function* testFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* testFiles(path);
    else if (entry.name.endsWith(".test.ts")) yield relative(ROOT, path);
  }
}

const found = [...testFiles(ROOT)].sort();
const declared = [...KEYLESS].sort();

if (found.join("\n") !== declared.join("\n")) {
  throw new Error(
    "vitest.config.ts is out of date with the tree.\n" +
      `  on disk:  ${found.join(", ")}\n` +
      `  declared: ${declared.join(", ")}`,
  );
}

export default defineConfig({
  test: {
    include: KEYLESS,
    exclude: ["**/node_modules/**"],
  },
});
