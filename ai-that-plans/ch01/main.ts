// NOT A LISTING FROM THE BOOK.
//
// The chapter names this file once, in "Break it on purpose" — "Run the chapter
// with `npm run run-example -- ch01/main`" — and never prints it. All four
// experiments on that page are run through this file, so all it does is choose a
// run id and a task and hand them to the printed `run()`:
//
//   ch01/main                          r_8f21, the warranty job from the chapter
//   ch01/main r_9c04                   same task, a different run id
//   ch01/main r_9c04 "front brake ..."  a different job entirely
//
// Same command, same run id, twice = the resume. Same command, `.runs/` deleted
// first = the fresh start, planner call and all.
const runId = process.argv[2] ?? "r_8f21";
const task =
  process.argv[3] ?? "Verano hybrid under warranty, rear hub grinding.";

// The key is checked here, before ch01/steps.ts is loaded, because that module
// constructs the provider client at import time and would otherwise throw the
// SDK's own error before this file runs a line. Hence the dynamic import below.
if ((process.env.ANTHROPIC_API_KEY ?? "") === "") {
  console.error(
    "ANTHROPIC_API_KEY is not set.\n" +
      "The planner is a model call, so this listing cannot run without one.\n" +
      "  1. cp ../.env.example ../.env      (or .env in this directory)\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n" +
      "Get a key at https://console.anthropic.com/.\n\n" +
      "ch01/inspect reads the state a previous run left behind and needs no key.",
  );
  process.exit(1);
}

const { run } = await import("./run.js");

console.log(`${runId}: ${task}`);
const state = await run(runId, task);

console.log(`\n${state.done.length}/${state.plan.length} steps, .runs/${runId}.json`);
for (const entry of state.done) {
  console.log(`  ${entry.step}: ${entry.result}`);
}
