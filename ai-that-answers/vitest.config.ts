import { defineConfig } from "vitest/config";

// The default suite is the one CI runs: no network, no API key, milliseconds.
// Chapter 5's probe is the only test in this book that calls the model, so its
// directory is excluded here and run by `npm run test:live` instead.
export default defineConfig({
  test: {
    include: ["ch*/**/*.test.ts"],
    exclude: ["**/node_modules/**", "ch05/**"],
  },
});
