// NOT A LISTING FROM THE BOOK.
//
// The chapter says its nodes "read a small fixture in ch05/shop.ts" and prints
// the nodes but not the fixture, so here it is.
//
// Two jobs, one file:
//
//   1. Re-export the shared tool surface, so the import form printed elsewhere
//      in the book — `import { TOOLS, runTool } from "./shop.js"` — resolves in
//      this directory as well as `import * as shop from "../shop/tools.js"`.
//
//   2. Provide the `shop` object ch05/steps.ts destructures: the same single
//      order and the same single hub as ../shop/tools.ts, in the shape these
//      six nodes read them — an order table you can search by model, and a
//      parts table keyed by frame number.
//
// Nothing here calls a model or reaches a network. The whole point of this
// chapter's graph is that the same input produces the same run every time, so
// that anything which changes between two runs is the checkpointer's doing.
export * from "../shop/tools.js";

import { bookSlot, placeOrder } from "../shop/tools.js";

interface Part {
  code: string;
  supplier: string;
  priceGbp: number;
}

export const shop = {
  /** Searched with `request.includes(model)`, so the model reads the way a
   *  customer would type it. */
  orders: [
    {
      id: "ORD-4471",
      model: "Verano hybrid",
      frameNumber: "VER-8802",
      purchased: "2025-11-03",
      coverEndsOn: "2027-11-03",
    },
  ],

  /** Keyed by frame number: which hub fits which bike. */
  parts: {
    "VER-8802": {
      code: "HB-118",
      supplier: "Fettle Components",
      priceGbp: 68.4,
    },
  } as Record<string, Part>,

  /** Idempotent per part and supplier, from the shared surface. A resumed
   *  run repeats the superstep that was in flight, so the node that spends
   *  money gets the same reference back rather than ordering twice. */
  placeOrder,

  /** The workshop diary. Always the next free bay. */
  bookSlot,
};
