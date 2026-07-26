// NOT A LISTING FROM THE BOOK.
//
// Chapter 8's four keyless checks: the lane every tool takes, the argument
// that moves one, the tool nobody put on the ladder, and the paragraph a
// reviewer is shown. No key, no service, nothing written anywhere.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { RUNG } from "./ladder.js";
import { decide } from "./policy.js";
import { planFor, refundPlan } from "./plans.js";

const call = (name: string, input: unknown): ToolUseBlock => ({
  type: "tool_use",
  id: "toolu_example",
  caller: { type: "direct" },
  name,
  input,
});

console.log("=== the lane every tool on the surface takes ===\n");
for (const name of Object.keys(RUNG)) {
  const { lane, why } = decide(call(name, {}));
  console.log(`  ${name.padEnd(20)} ${lane.padEnd(8)} ${why}`);
}

console.log("\n=== the rung is sometimes a function of the arguments ===\n");
for (const amount of [1_500, 2_000, 2_001, 8_900]) {
  const { lane, why } = decide(
    call("issue_refund", { order_id: "ORD-4471", amount_cents: amount }),
  );
  console.log(`  ${String(amount).padStart(6)}  ${lane.padEnd(8)} ${why}`);
}

console.log("\n=== a tool nobody put on the ladder ===\n");
const unknown = decide(call("issue_credit_note", {}));
console.log(`  ${unknown.lane}  ${unknown.why}`);
console.log("  compare that against what an ?? \"auto\" default would do.");

console.log("\n=== what the reviewer is shown ===\n");
console.log(
  await refundPlan({
    order_id: "ORD-4471",
    amount_cents: 8_900,
    reason: "damaged",
  }),
);

console.log("\n=== and for a tool with no dry-run ===\n");
console.log(await planFor(call("check_stock", { sku: "BRK-1180" })));
