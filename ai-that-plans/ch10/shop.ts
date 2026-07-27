// NOT A LISTING FROM THE BOOK.
//
// Two jobs, one file — the same two every chNN/shop.ts in this repository has:
//
//   1. Re-export the shared tool surface, so the import form printed elsewhere
//      in the book — `import { TOOLS, runTool } from "./shop.js"` — resolves in
//      this directory as well as `import * as shop from "../shop/tools.js"`.
//
//   2. Provide the fixture ch10/steps.ts reads.
//
// The fixture differs from chapter 5's in exactly two values, and both of them
// are printed by the chapter rather than chosen here:
//
//   * the hub for frame VER-8802 is `HUB-DX-135`, because the whole chapter is
//     the workshop manager saying that part is wrong and `HUB-VR-142` is right;
//   * the workshop slot is `Tue 09:00`, because that is the sentence every
//     printed run of this chapter ends on ("We have you in on Tue 09:00.").
//
// No model call and no network anywhere. A chapter about reading and correcting
// a run's history is only teachable if two runs of one input produce the same
// history, which is chapter 5's reason and it has not changed.
export * from "../shop/tools.js";

import { placeOrder } from "../shop/tools.js";

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

  /** Keyed by frame number. This is the row the manager disputes: the Verano
   *  changed rear hub partway through its model year and VER-8802 is on the
   *  later one, so the answer the catalogue gives here is the wrong hub. */
  parts: {
    "VER-8802": {
      code: "HUB-DX-135",
      supplier: "Coldharbour Distribution",
      priceGbp: 68.4,
    },
  } as Record<string, Part>,

  /** Idempotent per part and supplier, from the shared surface. A fork past a
   *  step that spends money is a step that may spend it again — which is the
   *  chapter's own warning, and this is what makes it survivable here. */
  placeOrder,

  /** The workshop diary. Fixed, not "next Thursday", because the printed
   *  output has to be the same on a Monday and on a Friday. */
  bookSlot: async (frame: string): Promise<string> => {
    if (frame !== "VER-8802") throw new Error(`no frame ${frame}`);
    return "Tue 09:00";
  },
};
