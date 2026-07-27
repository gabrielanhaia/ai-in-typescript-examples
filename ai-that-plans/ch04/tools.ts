// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "`runStep` is `ch04/tools.ts` in the companion repo — the
// shop's six tools from Book 3, unchanged, against a local sample database,
// with one of them arranged to fail on its first call so the retry route has
// something real to do."
//
// So this file is the shared fixture in ../shop/tools.ts, re-exported whole,
// plus the one thing chapter 4 needs that the other chapters do not: a
// `runStep` that ANSWERS with a result instead of throwing. The printed
// ch04/nodes.ts reads
//
//     const result = await runStep(step, state.cursor);
//     if (!result.ok) return { attempts, lastError: result.error };
//
// and a node that let the failure escape as an exception would take the graph
// down instead of taking the retry route. The failure itself is the shared
// fixture's, unchanged: `find_parts` times out the first time it is attempted
// at a given cursor and succeeds on the retry. This file only decides how it
// is handed back.
//
// The explicit `runStep` below shadows the one arriving through `export *`,
// which is what both TypeScript and the ESM spec do with a name that is
// exported locally and by a star at the same time.
export * from "../shop/tools.js";

import { runStep as attemptStep } from "../shop/tools.js";

/** A step that ran, or a step that did not and why. */
export type StepResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

export async function runStep(name: string, at?: number): Promise<StepResult> {
  try {
    return { ok: true, output: await attemptStep(name, at) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
