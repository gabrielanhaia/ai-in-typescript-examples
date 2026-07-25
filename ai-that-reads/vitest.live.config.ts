import { defineConfig } from "vitest/config";

// The live suite. Chapter 14's configuration test asks the database what width
// the `embedding` column actually is, so it needs the Postgres container and
// DATABASE_URL. It spends no tokens and calls no provider — it is "live"
// because it needs infrastructure, not because it needs a key.
//
//   docker compose up -d
//   npm run db:setup
//   npm run test:live
//
// Never wired into `npm run verify`.
//
// One test file is expected here, three tests:
//   ch14/config.test.ts   3 tests   sampling, overlap, vector column width
export default defineConfig({
  test: {
    include: ["ch14/config.test.ts"],
    testTimeout: 30_000,
    // The chapter's listing opens chapter 7's pool and, being a listing from
    // the book, does not close it. Vitest tears the worker down instead of
    // waiting for an idle connection to time out.
    teardownTimeout: 5_000,
  },
});
