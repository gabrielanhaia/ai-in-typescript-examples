// NOT A LISTING FROM THE BOOK.
//
// The chapter's keyless claims, run. Three of chapter 7's five exercises need
// no key, no container and no network, and they are the three the chapter says
// fail with no error at all — which is exactly why they are worth watching.
// This is the chapter default and what the test suite uses.
//
// The two that call a model are run on their own:
//
//     npm run run-example -- ch07/try-recall
//     npm run run-example -- ch07/try-compaction

console.log("=== the whole store surface, outside any graph ===\n");
await import("./store.js");

console.log("\n=== break the namespace: no error, no warning, null ===\n");
await import("./try-namespace.js");

console.log("\n=== watch search truncate: forty in, ten out ===\n");
await import("./try-truncation.js");

console.log("\n=== trim without shrinking: the two numbers diverge ===\n");
await import("./try-window.js");
