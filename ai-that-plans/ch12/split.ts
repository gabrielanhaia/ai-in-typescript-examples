// ch12/split.ts
import { report, type Team } from "./overlap.js";

/** The four specialists as the whiteboard had them. */
const AS_DRAWN: Team = {
  orders: ["lookup_order"],
  warranty: ["check_warranty"],
  parts: ["find_parts", "order_part"],
  scheduling: ["book_workshop_slot", "notify_customer"],
};

/** The same four after each one asked for the frame number, and
 *  parts asked what the warranty covers. */
const AS_SHIPPED: Team = {
  orders: ["lookup_order"],
  warranty: ["lookup_order", "check_warranty"],
  parts: ["lookup_order", "check_warranty", "find_parts", "order_part"],
  scheduling: ["lookup_order", "book_workshop_slot", "notify_customer"],
};

for (const line of report(AS_DRAWN)) console.log("drawn  ", line);
for (const line of report(AS_SHIPPED)) console.log("shipped", line);
