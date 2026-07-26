// PRINTED IN CHAPTER 6 as `ch06/toolbox.test.ts`.
//
// These two need the sample service answering and still no key, which is why
// they are in `npm run test:live` and not in `npm run verify`:
//
//   docker compose up -d
//   npm run test:live
import { expect, test } from "vitest";
import { toolboxFor } from "./toolbox.js";

const ctx = {
  customerId: "cust_4471",
  token: "test-token",
  runId: "r_test",
  signal: AbortSignal.timeout(5_000),
};

test("an unknown order is advice, not a failure", async () => {
  const [getOrderStatus] = toolboxFor(ctx);
  const text = await getOrderStatus.invoke({ order_id: "ORD-0000" });

  expect(text).toContain("no order ORD-0000");
  expect(text).toContain("find_orders");
});

test("a wrong-typed order number never reaches the API", async () => {
  const [getOrderStatus] = toolboxFor(ctx);
  const bad = getOrderStatus.invoke({ order_id: 4471 });

  await expect(bad).rejects.toThrow();
});
