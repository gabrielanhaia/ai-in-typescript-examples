// PRINTED IN CHAPTER 12 as `ch12/cited.test.ts`.
//
// Offline: nothing here loads the index or calls a provider. Resolving a
// citation is a regular expression and a lookup. The `sources` fixture is not
// printed.
import { expect, test } from "vitest";
import { citationsIn } from "./cited.js";

const sources = new Map<string, string>([
  ["Warranty policy, Crash replacement", "warranty-policy.md#04"],
]);

test("a label the model invented is reported, not dropped", () => {
  const { cited, unresolved } = citationsIn(
    "See [Warranty policy, Exchanges].",
    sources,
  );

  expect(cited).toEqual([]);
  expect(unresolved).toEqual(["Warranty policy, Exchanges"]);
});
