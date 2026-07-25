// Not a listing from the book: a driver so the chapter's pure modules can be run
// and their output shown. It calls no model, needs no API key, and its output is
// arithmetic, so it is identical on every machine.
//
// The shape below uses the chapter's placeholder figures. Replace them with your
// own measurements from ch10; the totals will change and the ranking will not.
import { RATES, VERIFIED_ON } from "./rates.js";
import { costOf } from "./cost.js";
import { totalCost, type Shape } from "./simulate.js";
import { inputBudgetPerTurn } from "./budget.js";

const MODEL = "claude-haiku-4-5";
const rates = RATES[MODEL];

console.log(
  `rates verified ${VERIFIED_ON}: ${MODEL} = ` +
    `$${rates?.input}/$${rates?.output} per MTok in/out\n`,
);

console.log("one call, 1,200 in / 300 out");
console.log(
  `  $${costOf({ input: 1_200, output: 300, cacheRead: 0, cacheWrite: 0 }, MODEL).toFixed(6)}\n`,
);

const TURNS = 20;
const shape: Shape = { system: 100, question: 50, answer: 150, summary: 200 };

console.log(`${TURNS} turns, three history strategies`);
for (const [name, window, summary] of [
  ["full replay", TURNS, 0],
  ["sliding window (6)", 6, 0],
  ["running summary (6+200)", 6, shape.summary],
] as const) {
  const total = totalCost(TURNS, window, { ...shape, summary }, MODEL);
  console.log(`  ${name.padEnd(24)} $${total.toFixed(3)}`);
}

console.log(
  "\nThe bounded strategies win by a third, not an order of magnitude:\n" +
    "output costs five times input, and trimming only acts on input.\n" +
    "The running summary costs MORE than the window it replaces.",
);

// A return of zero is informative rather than an error: the answers alone
// already exceed the target, and no amount of trimming the history fixes that.
console.log("\ninput budget per turn, from a target cost per conversation");
for (const target of [0.01, 0.05, 0.2]) {
  const budget = inputBudgetPerTurn(target, 20, 150, MODEL);
  const note = budget === 0 ? "  (answers alone already exceed the target)" : "";
  console.log(`  $${target.toFixed(2)} over 20 turns -> ${Math.round(budget)} tokens/turn${note}`);
}
