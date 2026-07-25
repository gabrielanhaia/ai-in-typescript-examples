// ch10/context.ts
import type { Reranked } from "../ch09/retrieve.js";

export interface Sourced {
  marker: number;
  hit: Reranked;
}

/**
 * Number the passages and wrap each one in a delimiter the
 * model can see.
 */
export function contextBlock(hits: Reranked[]): {
  text: string;
  sources: Sourced[];
} {
  const sources = hits.map((hit, index) => ({ marker: index + 1, hit }));

  const text = sources
    .map(({ marker, hit }) =>
      [
        `<source id="${marker}" file="${hit.sourceId}">`,
        hit.content.trim(),
        `</source>`,
      ].join("\n"),
    )
    .join("\n\n");

  return { text, sources };
}
