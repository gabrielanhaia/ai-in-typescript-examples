// NOT A LISTING FROM THE BOOK.
//
// The price list behind `quoteFor`, which ch04/fanout.ts imports and the book
// does not print. The chapter's use for `Send` is "the parts lookup:
// `find_parts` produces several candidate hubs that fit the frame, and pricing
// them one after another is a queue of network calls where a fan-out would do."
// This is that queue, as a fixture: four hubs, fixed prices, one of them out of
// stock, and a delay so that doing them one at a time is visibly slower than
// doing them at once.
//
// HB-118 at GBP 68.40 is the hub the rest of the book already knows about —
// see HUB in ../shop/tools.ts.

/** What one supplier lookup costs, in milliseconds. */
export const LOOKUP_MS = 120;

const CATALOGUE: Record<string, { inStock: boolean; pence: number }> = {
  "HB-118": { inStock: true, pence: 6840 },
  "HB-120": { inStock: true, pence: 7195 },
  "HB-131": { inStock: false, pence: 5990 },
  "HB-142": { inStock: true, pence: 7420 },
};

/** The four hubs that fit VER-8802. What `find_parts` would hand the fan-out. */
export const CANDIDATES = Object.keys(CATALOGUE);

export interface Quote {
  sku: string;
  inStock: boolean;
  pence: number;
}

/** One network call, faked. A sku nobody stocks answers; it never throws. */
export async function quoteFor(sku: string): Promise<Quote> {
  await new Promise((resolve) => setTimeout(resolve, LOOKUP_MS));
  const line = CATALOGUE[sku] ?? { inStock: false, pence: 0 };
  return { sku, inStock: line.inStock, pence: line.pence };
}
