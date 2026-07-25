import { expect, test } from "vitest";
import { LABELS, classify } from "./classify.js";

// The version to avoid, kept here for contrast:
//
//   expect(await classify("my chain keeps slipping")).toBe("drivetrain");
//
// It tests one composed string. The version below tests the contract first and
// the expectation second, so a failure tells you which of the two broke.

test("the label is one of the known labels, and it is the expected one", async () => {
  // Right: asserts what the code downstream depends on.
  const label = await classify("my chain keeps slipping");
  expect(LABELS).toContain(label);
  expect(label).toBe("drivetrain");
});
