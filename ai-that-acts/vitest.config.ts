import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig } from "vitest/config";

// The default suite, and the one CI runs: no network, no key, no container,
// milliseconds. `npm run verify` runs exactly this.
//
// Every test file in the repository is listed here by exact path. Book 1 was
// bitten by the alternative: it excluded `ch05/**` from this suite, the
// directory it meant was later renamed, the glob silently stopped matching,
// and a test that spends money leaked into the suite that is not supposed to
// spend anything. A wrong exact path fails loudly; a stale glob does not fail
// at all.
//
// FOUR files are expected here, SEVEN tests in total:
//   ch03/toolbox.test.ts        3 tests   the executor: valid, rejected, unknown
//   ch12/cited.test.ts          1 test    an invented label is reported
//   ch13/weekly-report.test.ts  1 test    the boundary at the threshold
//   ch14/no-sampling.test.ts    2 tests   the grep, and that the grep walks
export const KEYLESS = [
  "ch03/toolbox.test.ts",
  "ch12/cited.test.ts",
  "ch13/weekly-report.test.ts",
  "ch14/no-sampling.test.ts",
];

// ONE file, TWO tests. It needs the sample service answering and still no
// key, which is why it is "live" — infrastructure, not tokens. Never wired
// into `npm run verify`.
//   ch06/toolbox.test.ts        2 tests   a 404 is advice; a bad type never
//                                         reaches the API
export const LIVE = ["ch06/toolbox.test.ts"];

// The guard the glob did not give Book 1: a test file that exists and is in
// neither list, or a listed file that has been renamed, fails at config load
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
const declared = [...KEYLESS, ...LIVE].sort();

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
