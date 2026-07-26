// PRINTED IN CHAPTER 12 as `ch12/passages.ts`.
//
// Each result is headed by where it came from. Locations are already
// distinct, so a second call needs no offset; a numbered marker would
// restart at one and mean something else.
import { citable, locationOf, type Reranked } from "../retrieval/retrieve.js";

export function passagesFor(
  hits: Reranked[],
  query: string,
  sources: Map<string, string>,
): string {
  if (hits.length === 0) {
    return (
      `Nothing in the Braxby documentation matches "${query}". Search ` +
      `once more with the shop's own words before telling the customer ` +
      `there is no policy on it.`
    );
  }

  return hits
    .map((hit) => {
      const meta = citable(hit);
      const where = locationOf(meta);
      const label = where === "" ? meta.title : `${meta.title}, ${where}`;
      sources.set(label, meta.chunkId);
      return `[${label}]\n${hit.content.trim()}`;
    })
    .join("\n\n");
}
