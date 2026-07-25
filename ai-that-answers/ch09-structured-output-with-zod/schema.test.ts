import { describe, expect, it } from "vitest";
import { Triage } from "./schema.js";

describe("Triage", () => {
  it("rejects a category outside the enum", () => {
    const result = Triage.safeParse({
      category: "urgent",
      urgency: "high",
      summary: "Cannot log in.",
      productArea: null,
    });

    expect(result.success).toBe(false);
  });

  it("requires productArea to be present, even as null", () => {
    const result = Triage.safeParse({
      category: "bug",
      urgency: "high",
      summary: "Cannot log in.",
    });

    expect(result.success).toBe(false);
  });
});
