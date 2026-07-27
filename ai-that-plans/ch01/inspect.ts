// PRINTED IN CHAPTER 1, in full, under "What the file looks like on disk". It is
// printed as top-level code rather than as a function, and it stays that way
// here: the point of the listing is that a second process, owning nothing, can
// answer "what is in flight?" without starting a model or a loop.
//
// It reads `.runs` relative to the working directory and does not create it, so
// run `ch01/main` at least once first — on a clean clone this throws ENOENT.
// ch01/inspect.ts
import { readdir, readFile } from "node:fs/promises";
import type { RunState } from "./state.js";

// Answers "what is in flight and where did it get to?" without
// starting a model, a loop, or a process that owns the run.
for (const name of await readdir(".runs")) {
  if (!name.endsWith(".json")) continue;
  const raw = await readFile(`.runs/${name}`, "utf8");
  const state = JSON.parse(raw) as RunState;
  const at = state.done.length;
  console.log(
    `${state.runId} ${at}/${state.plan.length} ` +
      `next=${state.plan[at] ?? "done"} at=${state.updatedAt}`,
  );
}
