// PRINTED IN CHAPTER 7 as `ch07/streak.ts` — the `advice` method.
//
// The class around it is not printed: a Map, a counter, and the reset that
// makes "twice in a row" mean in a row.
export class Streak {
  readonly #counts = new Map<string, number>();

  failed(tool: string): void {
    this.#counts.set(tool, (this.#counts.get(tool) ?? 0) + 1);
  }

  succeeded(tool: string): void {
    this.#counts.set(tool, 0);
  }

  advice(tool: string): string {
    return (this.#counts.get(tool) ?? 0) < 2
      ? ""
      : ` This tool has now failed twice in a row. Do not call it ` +
        `again. Answer with what you already have and say which ` +
        `part you could not check.`;
  }
}
