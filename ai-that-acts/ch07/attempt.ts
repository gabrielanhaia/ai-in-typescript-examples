// PRINTED IN CHAPTER 7 as `ch07/attempt.ts`.
//
// `pause` is Book 1 chapter 12's exponential backoff with jitter. It is not
// reprinted there and it is eight lines, so it is here rather than imported
// from a book this directory does not contain.
import { HttpFailure } from "./classify.js";

async function pause(n: number): Promise<void> {
  const ceiling = Math.min(2 ** n * 250, 8_000);
  const ms = ceiling * (0.5 + Math.random() / 2);
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function attempt<T>(
  work: () => Promise<T>,
  tries = 3,
): Promise<T> {
  for (let n = 1; ; n += 1) {
    try {
      return await work();
    } catch (error) {
      const transient =
        error instanceof HttpFailure && error.kind === "transient";
      if (!transient || n === tries) throw error;
      await pause(n);
    }
  }
}
