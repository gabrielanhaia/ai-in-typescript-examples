// NOT A LISTING FROM THE BOOK.
//
// Chapter 7's three keyless claims, run: the status table, the repair
// sentence, and the invariant that a batch of three where one throws still
// answers all three. No key, no service.
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { z } from "zod";
import type { Session } from "../ch06/session.js";
import type { RegisteredTool } from "../ch03/define-tool.js";
import { kindOf } from "./classify.js";
import { repair } from "./run-one.js";
import { resultsFor } from "./batch.js";
import { Streak } from "./streak.js";

console.log("=== which class does a status code fall into ===\n");
for (const status of [400, 401, 403, 404, 408, 422, 429, 500, 502, 503]) {
  console.log(`  ${status}  ${kindOf(status)}`);
}

console.log("\n=== what the model reads when a schema rejects ===\n");
const rejected = z
  .object({ amount_cents: z.number().int().positive() })
  .safeParse({ amount_cents: -5 });
if (!rejected.success) console.log(repair(rejected.error));

console.log("\n=== one tool in three throws; all three are answered ===\n");
const tool = (name: string, run: () => Promise<string>): RegisteredTool => ({
  definition: {
    name,
    description: name,
    input_schema: { type: "object", properties: {} },
  },
  invoke: run,
});

const session: Session = {
  definitions: [],
  byName: new Map([
    ["get_order_status", tool("get_order_status", async () => "dispatched")],
    ["search_docs", tool("search_docs", async () => "the returns window")],
    ["check_stock", tool("check_stock", async () => {
      throw new Error("The stock service is not answering.");
    })],
  ]),
};

const call = (name: string): ToolUseBlock => ({
  type: "tool_use",
  id: `toolu_${name}`,
  caller: { type: "direct" },
  name,
  input: {},
});

const results = await resultsFor(
  [call("get_order_status"), call("check_stock"), call("search_docs")],
  session,
);

for (const block of results) {
  console.log(
    `  ${block.tool_use_id.padEnd(24)} ` +
      `${block.is_error === true ? "is_error" : "ok      "} ` +
      `${String(block.content)}`,
  );
}
console.log(`\n  ${results.length} results for 3 calls, in the order asked.`);

console.log("\n=== and after the second failure in a row ===\n");
const streak = new Streak();
streak.failed("check_stock");
streak.failed("check_stock");
console.log(`  "The stock service is not answering.${streak.advice("check_stock")}"`);
