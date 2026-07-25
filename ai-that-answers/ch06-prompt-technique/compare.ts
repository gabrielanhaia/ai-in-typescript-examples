import { checks } from "./checks.js";
import { inputs } from "./inputs.js";
import { score } from "./score.js";
import { BASELINE, CANDIDATE } from "./variants.js";

const RUNS_PER_INPUT = 3;

for (const variant of [BASELINE, CANDIDATE]) {
  const tally = await score(variant, inputs, checks, RUNS_PER_INPUT);
  console.log(`\n${tally.variant}  (${tally.runs} runs)`);
  for (const check of checks) {
    const passed = tally.passes[check.name] ?? 0;
    const pct = ((passed / tally.runs) * 100).toFixed(0);
    console.log(`  ${check.name.padEnd(16)} ${passed}/${tally.runs}  ${pct}%`);
  }
}
