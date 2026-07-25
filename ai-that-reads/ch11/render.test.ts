// ch11/render.test.ts
import { describe, expect, it } from "vitest";
import type { Citable } from "./identity.js";
import { renderAnswer } from "./render.js";

const SUPPLIED: Citable[] = [
  {
    chunkId: "markdown/staff-handbook/04-returns-desk.md#1",
    title: "Staff handbook, 4. The returns desk",
    headings: ["The returns desk", "The window"],
  },
  {
    chunkId: "pdf/terms-of-sale-2026.pdf#4",
    title: "Terms of sale 2026",
    pages: [2, 3],
  },
];

describe("renderAnswer", () => {
  it("labels a PDF chunk that spans a page break as a range", () => {
    const answer = "The record is determinative [2].";
    const { cited } = renderAnswer(answer, SUPPLIED);

    expect(cited[0].label).toBe("Terms of sale 2026, pp. 2-3");
  });

  it("reports a marker the model invented", () => {
    const { cited, unknownMarkers } = renderAnswer(
      "The window is 30 days [1] and returns are free [7].",
      SUPPLIED,
    );

    expect(cited.map((c) => c.marker)).toEqual([1]);
    expect(unknownMarkers).toEqual([7]);
  });

  it("does not list a supplied source the answer never cited", () => {
    const answer = "The window runs from delivery [1].";
    const { cited } = renderAnswer(answer, SUPPLIED);

    expect(cited.map((c) => c.chunkId)).toEqual([
      "markdown/staff-handbook/04-returns-desk.md#1",
    ]);
  });
});
