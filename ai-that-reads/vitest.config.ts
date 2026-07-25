import { defineConfig } from "vitest/config";

// The default suite, and the one CI runs: no network, no key, no container,
// milliseconds. `npm run verify` runs exactly this.
//
// The exclusion is an exact file path, not a glob over a directory. Book 1
// excluded `ch05-*/**`, the directory was later renamed to `ch05`, the glob
// silently stopped matching, and a test that spends money leaked into the
// suite that is not supposed to spend anything. A wrong exact path fails
// loudly; a stale glob does not fail at all.
//
// Two test files are expected here, six tests in total:
//   ch11/render.test.ts   3 tests   citation rendering
//   ch12/score.test.ts    3 tests   recall@k and MRR
// If that count changes without a listing being added, something moved.
export default defineConfig({
  test: {
    include: ["ch*/**/*.test.ts"],
    exclude: ["**/node_modules/**", "ch14/config.test.ts"],
  },
});
