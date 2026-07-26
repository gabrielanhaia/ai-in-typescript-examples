// PRINTED IN CHAPTER 13 as `ch13/weekly-report.test.ts`.
//
// Exactly on the threshold, in milliseconds, offline. The looped version
// cannot be tested this way at all: it has no numeric cut-off to assert
// against, only a disposition.
import { expect, test, vi } from "vitest";
import * as workshop from "../app/workshop.js";
import { weeklyReport } from "./weekly-report.js";

test("a part waiting six days is named; five is not", async () => {
  vi.spyOn(workshop, "bookingsBetween").mockResolvedValue([
    { reference: "WS-2211", status: "awaiting-parts", job: "brake-bleed",
      waitingDays: 6, part: "BRK-1180" },
    { reference: "WS-2212", status: "awaiting-parts", job: "service",
      waitingDays: 5, part: "DRV-4402" },
  ]);

  const report = await weeklyReport("2026-07-13", "2026-07-19");

  expect(report).toContain("WS-2211");
  expect(report).not.toContain("WS-2212");
});
