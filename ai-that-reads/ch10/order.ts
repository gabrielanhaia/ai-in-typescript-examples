// ch10/order.ts
/** Best first, second-best last, worst in the middle. */
export function edgesFirst<T>(ranked: T[]): T[] {
  const head: T[] = [];
  const tail: T[] = [];

  for (const [index, item] of ranked.entries()) {
    if (index % 2 === 0) head.push(item);
    else tail.push(item);
  }

  return [...head, ...tail.reverse()];
}
