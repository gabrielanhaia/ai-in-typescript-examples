// NOT A LISTING FROM THE BOOK.
//
// Chapter 9's ceilings and its stall detector, fired one at a time, with no
// model anywhere near them. Every number here is one your code owns.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { Ledger, type Limits } from "./limits.js";
import { Repeats, signature, stalled } from "./repeats.js";
import { USD_PER_MTOK, VERIFIED_ON } from "./rates.js";

const usage = {
  input_tokens: 4_000,
  output_tokens: 500,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 1_200,
};

function trip(name: string, limits: Limits, spends: number): void {
  const ledger = new Ledger(limits, new AbortController().signal);
  for (let n = 0; n < spends; n += 1) {
    const stop = ledger.exceeded();
    if (stop !== undefined) {
      console.log(`  ${name.padEnd(8)} ended=${stop.kind} ` +
        `steps=${ledger.spent.steps} tokens=${ledger.spent.tokens}`);
      return;
    }
    ledger.spend(usage as never);
  }
  console.log(`  ${name.padEnd(8)} never tripped`);
}

console.log("=== each ceiling, on its own ===\n");
trip("steps", { maxSteps: 3, maxTokens: 1e9, maxWallMs: 1e9 }, 10);
trip("tokens", { maxSteps: 99, maxTokens: 12_000, maxWallMs: 1e9 }, 10);

const cancelled = new AbortController();
cancelled.abort();
const stopped = new Ledger(
  { maxSteps: 8, maxTokens: 120_000, maxWallMs: 60_000 },
  cancelled.signal,
).exceeded();
console.log(`  cancel   ended=${stopped?.kind}`);

console.log("\n=== all four token fields, not two ===\n");
const ledger = new Ledger(
  { maxSteps: 8, maxTokens: 120_000, maxWallMs: 60_000 },
  new AbortController().signal,
);
ledger.spend(usage as never);
console.log(
  `  input ${usage.input_tokens} + output ${usage.output_tokens} + ` +
    `cache read ${usage.cache_read_input_tokens} = ${ledger.spent.tokens}`,
);
const rate = USD_PER_MTOK["claude-sonnet-5"];
console.log(
  `  at $${rate.input}/$${rate.output} per MTok (read ${VERIFIED_ON}): ` +
    `$${((usage.input_tokens * rate.input +
      usage.output_tokens * rate.output) / 1e6).toFixed(5)}`,
);

console.log("\n=== the same call, twice, then a third time ===\n");
const call = (order: string, name = "get_order_status"): ToolUseBlock => ({
  type: "tool_use",
  id: `toolu_${Math.random().toString(36).slice(2, 8)}`,
  caller: { type: "direct" },
  name,
  input: { order_id: order },
});

const repeats = new Repeats();
console.log(`  key order does not matter: ${signature({
  ...call("ORD-9999"),
  input: { order_id: "ORD-9999", note: "x" },
})}`);

for (let n = 1; n <= 3; n += 1) {
  const one = call("ORD-9999");
  const before = repeats.seen(one);
  if (before === undefined) repeats.remember(one, "No order ORD-9999 exists.");
  console.log(
    `  call ${n}: ${before === undefined ? "ran the tool" : "answered from the cache"}` +
      `  stalled=${stalled(repeats)?.kind ?? "no"}`,
  );
}
