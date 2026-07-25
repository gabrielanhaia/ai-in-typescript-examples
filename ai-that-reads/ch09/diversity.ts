// ch09/diversity.ts
export function capPerSource<T extends { sourceId: string }>(
  hits: T[],
  perSource: number,
): T[] {
  const seen = new Map<string, number>();

  return hits.filter((hit) => {
    const used = seen.get(hit.sourceId) ?? 0;
    if (used >= perSource) return false;
    seen.set(hit.sourceId, used + 1);
    return true;
  });
}
