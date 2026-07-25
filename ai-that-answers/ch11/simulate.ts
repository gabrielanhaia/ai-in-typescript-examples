import { costOf } from "./cost.js";

export interface Shape {
  system: number;
  question: number;
  answer: number;
  summary: number;
}

export function totalCost(
  turns: number,
  window: number,
  shape: Shape,
  model: string,
): number {
  let total = 0;

  for (let n = 1; n <= turns; n += 1) {
    const carried = Math.min(n - 1, window);
    const input =
      shape.system +
      (window < turns ? shape.summary : 0) +
      (shape.question + shape.answer) * carried +
      shape.question;

    total += costOf(
      { input, output: shape.answer, cacheRead: 0, cacheWrite: 0 },
      model,
    );
  }

  return total;
}
