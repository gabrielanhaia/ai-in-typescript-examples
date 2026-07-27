// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "`workshopTools` is the same six-tool surface the whole
// book has used — exported from `ch12/tools.ts` in the companion repo,
// unchanged."
//
// So this file is the shared fixture in ../shop/tools.ts, re-exported whole,
// plus the one name the chapter's printed listings import that the fixture
// does not itself define: the six tools in one array, in plan order.
//
// It is deliberately an array of the fixture's own `tool()` objects rather
// than six new ones. The whole comparison in this chapter rests on both sides
// calling the same functions with the same descriptions — a single agent that
// was quietly given better tools than the team would not be a measurement of
// anything.
export * from "../shop/tools.js";

import {
  bookWorkshopSlot,
  checkWarranty,
  findParts,
  lookupOrder,
  notifyCustomer,
  orderPart,
} from "../shop/tools.js";

/**
 * The six tools, in the order ch12/single.ts numbers them in its system
 * prompt. Order carries no meaning to the model — it is here so the array and
 * the prompt can be read against each other.
 */
export const workshopTools = [
  lookupOrder,
  checkWarranty,
  findParts,
  orderPart,
  bookWorkshopSlot,
  notifyCustomer,
];
