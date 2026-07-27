// NOT A LISTING FROM THE BOOK.
//
// What `find_parts` is doing while it is, in the chapter's words, "three
// suppliers deep and still looking". ch09/progress.ts imports `SUPPLIERS` and
// `searchSupplier` from here and the book never prints them.
//
// Three suppliers, a fixed catalogue, and a delay per lookup. The delay is not
// decoration: without it the loop finishes before the browser has painted, and
// a progress event nobody can see demonstrates nothing. It is the only reason
// this file is not four lines.
//
// HUB-VR-142 from Coldharbour Distribution is the hub the rest of the book
// already knows about (see HUB in ../shop/tools.ts); HUB-VR-142-B from
// Marchmont Wheelworks is the alternative chapter 8's human edits to.

/** What one supplier lookup costs, in milliseconds. */
export const SEARCH_MS = 400;

const CATALOGUE: Record<string, string[]> = {
  "Coldharbour Distribution": ["HUB-VR-142"],
  "Marchmont Wheelworks": ["HUB-VR-142-B"],
  "Fettle Components": [],
};

/** Searched in this order, one at a time — which is what makes the progress
 *  events worth emitting at all. */
export const SUPPLIERS = Object.keys(CATALOGUE);

/** One supplier's catalogue, faked. A supplier that stocks nothing answers
 *  with an empty list; it never throws. */
export async function searchSupplier(name: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, SEARCH_MS));
  return CATALOGUE[name] ?? [];
}
