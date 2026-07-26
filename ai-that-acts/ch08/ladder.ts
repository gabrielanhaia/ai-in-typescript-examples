// PRINTED IN CHAPTER 8 as `ch08/ladder.ts`.
export type Rung =
  | "read" // changes nothing
  | "reversible" // you can put it back, in one call, today
  | "expensive" // undoing it costs money, time or somebody's afternoon
  | "irreversible" // no undo exists
  | "external"; // it has already reached a person outside the building

export type Lane = "auto" | "log" | "confirm";

export const LANE: Record<Rung, Lane> = {
  read: "auto",
  reversible: "log",
  expensive: "confirm",
  irreversible: "confirm",
  external: "confirm",
};

/** Assigned here, in your code, per tool. Not inferred from the name,
 *  and never taken from whoever published the tool. */
export const RUNG: Record<string, Rung> = {
  find_orders: "read",
  get_order_status: "read",
  get_order_items: "read",
  check_stock: "read",
  search_docs: "read", // added when ch. 12 puts it on the surface
  book_workshop_slot: "reversible",
  issue_refund: "irreversible",
};
