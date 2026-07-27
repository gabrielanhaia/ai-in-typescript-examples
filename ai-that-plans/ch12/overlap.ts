// ch12/overlap.ts
export type Team = Record<string, readonly string[]>;

/** Of the smaller tool set, the share the other one also has. */
function shared(a: readonly string[], b: readonly string[]): number {
  const both = a.filter((t) => b.includes(t)).length;
  return both / Math.min(a.length, b.length);
}

export function report(team: Team): string[] {
  const lines: string[] = [];
  for (const [x, xs] of Object.entries(team)) {
    for (const [y, ys] of Object.entries(team)) {
      // Each unordered pair once, and never a pair with itself.
      if (x >= y) continue;
      lines.push(`${x} / ${y}  ${Math.round(shared(xs, ys) * 100)}%`);
    }
  }
  return lines;
}
