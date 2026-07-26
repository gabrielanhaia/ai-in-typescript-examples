// PRINTED IN CHAPTER 3 as `ch03/toolbox.test.ts`.
//
// Three tests, no API key, no fixtures, no running service. In
// `npm run verify`.
import { describe, expect, it } from "vitest";
import { execute } from "./toolbox.js";

const call = (name: string, input: unknown) =>
  ({
    type: "tool_use",
    id: "toolu_test",
    caller: { type: "direct" },
    name,
    input,
  }) as const;

describe("execute", () => {
  it("runs a valid call", async () => {
    const out = await execute(
      call("get_order_status", { order_id: "ORD-4471" }),
    );
    expect(out.is_error).toBe(false);
    expect(out.content).toContain("dispatched");
  });

  it("reports a schema failure as a readable error", async () => {
    const out = await execute(
      call("issue_refund", {
        order_id: "ORD-4471",
        amount_cents: -5,
        reason: "damaged",
      }),
    );
    expect(out.is_error).toBe(true);
    expect(out.content).toContain("amount_cents");
  });

  it("reports an unknown tool instead of throwing", async () => {
    const out = await execute(call("delete_everything", {}));
    expect(out.is_error).toBe(true);
  });
});
