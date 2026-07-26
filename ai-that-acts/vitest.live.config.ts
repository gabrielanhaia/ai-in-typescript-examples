import { defineConfig } from "vitest/config";
import { LIVE } from "./vitest.config.js";

// The live suite. Chapter 6's two tool tests ask the sample service what it
// says about an order that does not exist, so they need the container. They
// spend no tokens and call no provider — they are "live" because they need
// infrastructure, not because they need a key.
//
//   docker compose up -d
//   npm run test:live
//
// Never wired into `npm run verify`.
//
// One test file is expected here, two tests:
//   ch06/toolbox.test.ts   2 tests   a 404 is advice, a bad type is rejected
export default defineConfig({
  test: {
    include: LIVE,
    exclude: ["**/node_modules/**"],
    testTimeout: 15_000,
  },
});
