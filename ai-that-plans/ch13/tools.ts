// NOT A LISTING FROM THE BOOK.
//
// Chapter 4's `ch04/tools.ts`, carried into this chapter, plus the two
// fixtures this chapter's failures need.
//
// 1. The shared shop surface, re-exported whole, so both printed import forms
//    resolve here as well: `./shop.js` (one line, next door) and
//    `../shop/tools.js` (the fixture itself).
//
// 2. `runStep` ANSWERS with a result instead of throwing, because chapter 4's
//    printed `nodes.ts` reads `result.ok` and `result.error`. A node that let
//    the failure escape as an exception would take the graph down instead of
//    taking the retry route, and the retry route is what loops.
//
// 3. `alwaysFail` — the chapter's first loop cause is "put a step in the plan
//    that fails permanently and the flag is set forever", and the shared
//    fixture has no such step: its `find_parts` fails the FIRST time it is
//    attempted at a given cursor and succeeds on the retry, which is a
//    working retry rather than a loop. One test seam, set by the experiments
//    in `break-loop.ts` and by `seed.ts` when it rebuilds job 4818.
//
// 4. `proposalFor` — chapter 8's gate, in front of the one step that spends
//    money. The chapter says of the paused thread's interrupt value: "in this
//    graph, the part code and the price the assistant proposes to commit to",
//    so that is exactly the object, and nothing more.
//
// The explicit `runStep` below shadows the one arriving through `export *`,
// which is what both TypeScript and the ESM spec do with a name that is
// exported locally and by a star at the same time.
export * from "./shop.js";

import { findHub, placeOrder, runStep as attemptStep } from "./shop.js";

/** A step that ran, or a step that did not and why. */
export type StepResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

/** The frame the whole book works from. `findHub` throws on any other. */
export const FRAME = "VER-8802";

/** The one step in the plan that cannot be undone by running it again. */
export const SPENDS_MONEY = "order_part";

/** What a human is shown before the shop's money moves: the part code and
 *  the price. This is the value that ends up in `tasks[].interrupts[0]`. */
export interface Proposal {
  readonly code: string;
  readonly priceGbp: number;
}

/** `null` for every step that commits nothing, which is five of the six. */
export async function proposalFor(step: string): Promise<Proposal | null> {
  if (step !== SPENDS_MONEY) return null;
  const hub = await findHub(FRAME);
  return { code: hub.code, priceGbp: hub.priceGbp };
}

/** Test seam. `alwaysFail("find_parts")` is "a step in the plan that fails
 *  permanently"; `alwaysFail(null)` puts the shop back as it was. */
let permanent: string | null = null;

export function alwaysFail(step: string | null): void {
  permanent = step;
}

export async function runStep(
  name: string,
  at?: number,
): Promise<StepResult> {
  if (name === permanent) {
    return { ok: false, error: `${name}: supplier catalog unreachable` };
  }
  // The gate in `execute` has already been answered by the time this runs,
  // so this is where the shop actually buys the hub. `placeOrder` is
  // idempotent per part and supplier, so a resumed run cannot order twice.
  if (name === SPENDS_MONEY) {
    const hub = await findHub(FRAME);
    const ref = await placeOrder(hub.code, hub.supplier);
    return { ok: true, output: `ordered ${hub.code}, reference ${ref}` };
  }
  try {
    return { ok: true, output: await attemptStep(name, at) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
