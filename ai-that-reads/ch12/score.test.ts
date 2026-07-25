// ch12/score.test.ts
import { expect, test } from "vitest";
import type { EvalQuestion } from "./questions.js";
import { mrrAt, rankOf, recallAt } from "./score.js";

const question: EvalQuestion = {
  id: "q00",
  question: "How long do I have to send something back?",
  answer: "30 days.",
  answer_type: "grounded",
  authoritative: "markdown/returns-and-refunds.md",
  supporting: [
    {
      file: "markdown/returns-and-refunds.md",
      key: "within 30 days",
      passage: "",
    },
  ],
  requires_all: false,
  requires_ocr: false,
};

test("a key matches across a line break and a change of case", () => {
  const hits = [
    {
      sourceId: "markdown/returns-and-refunds.md",
      content: "send it back\nWithin 30 Days of delivery",
    },
  ];
  expect(rankOf(hits, question)).toBe(1);
});

test("the right words in the wrong file are not a hit", () => {
  const hits = [{ sourceId: "html/faq.html", content: "within 30 days" }];
  expect(rankOf(hits, question)).toBeUndefined();
});

test("a miss is a zero, not a row dropped from the denominator", () => {
  expect(recallAt([1, 4, undefined], 5)).toBeCloseTo(2 / 3);
  expect(mrrAt([1, 4, undefined], 5)).toBeCloseTo(1.25 / 3);
});
