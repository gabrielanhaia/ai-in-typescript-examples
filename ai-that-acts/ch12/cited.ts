// PRINTED IN CHAPTER 12 as `ch12/cited.ts`.
//
// The `Cited` shape is not printed. The `sources` argument is a single map
// built at the start of a run and handed to the tool factory; each search
// writes its labels into it against the chunk behind them.
export interface Cited {
  readonly label: string;
  readonly chunkId: string;
}

const LABEL = /\[([^\]\n]+)\]/g;

export function citationsIn(
  answer: string,
  sources: ReadonlyMap<string, string>,
): { cited: Cited[]; unresolved: string[] } {
  const cited: Cited[] = [];
  const unresolved: string[] = [];

  for (const [, label] of answer.matchAll(LABEL)) {
    const chunkId = sources.get(label);
    if (chunkId === undefined) unresolved.push(label);
    else if (!cited.some((seen) => seen.label === label)) {
      cited.push({ label, chunkId });
    }
  }

  return { cited, unresolved };
}
