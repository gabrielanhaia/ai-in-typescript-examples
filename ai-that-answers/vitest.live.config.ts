import { defineConfig } from "vitest/config";

// The live suite. It calls the model, so it costs a few tokens and needs
// ANTHROPIC_API_KEY. Never wired into `npm run verify`.
export default defineConfig({
  test: {
    include: ["ch05-*/**/*.test.ts"],
    testTimeout: 60_000,
  },
});
